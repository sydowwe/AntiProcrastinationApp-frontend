import type { APIRequestContext } from '@playwright/test'
import { apiUrl, type SeedResponse } from './seed'

/**
 * Creating a day-planner template and its tasks through the app's own HTTP API.
 *
 * **This is not how a spec gets a template to look at.** The `e2e-v2` fixture seeds three
 * (`seed.dayPlannerTemplates`), and the read-only views must be driven from those: they are documented
 * by a human opening the screen, so a row that exists only because a spec ran leaves them empty for
 * anyone who looks by hand. That is the whole argument in the API repo's `docs/e2eTestSeed.md`, and it
 * is why this module no longer backs a fixture.
 *
 * What is left is the other half — the **write** path, which seeding by definition never exercises.
 * `POST /api/task-planner-day-template` and `POST /api/template-planner-task` are ordinary
 * authenticated creates with no extra policy, so one spec can round-trip them.
 *
 * ## The rule for anything built on this
 *
 * **Whatever you create here, delete here.** `workers: 1` plus one reset per run means a row left
 * behind is still there for every later spec and for whoever opens the screen afterwards — five
 * templates where the fixture says three. Use {@link withTemporaryTemplate}, which cleans up even when
 * the body throws, rather than calling {@link createTemplate} directly.
 */

interface TimeDto {
	hours: number
	minutes: number
}

export interface TemplateBody {
	name: string
	isActive: boolean
	/** Wire value is the C# member name — `"Workday"`, not `"workday"`. */
	suggestedForDayType: 'Workday' | 'Weekend' | 'Holiday' | 'Vacation' | 'SickDay' | 'Special'
	description?: string
	icon?: string
	defaultWakeUpTime?: TimeDto
	defaultBedTime?: TimeDto
	scheduledDays?: string[]
	/**
	 * An **enum** (`Location?`: Home | Office | Travel) — unlike `location` on a template task, which is
	 * a free string. Same word, two types, one object apart.
	 */
	suggestedLocation?: 'Home' | 'Office' | 'Travel'
	tags?: string[]
}

export interface TemplateTaskBody {
	activityId: number
	startTime: TimeDto
	endTime: TimeDto
	isBackground: boolean
	location?: string
	notes?: string
}

const TEMPLATE_PATH = '/api/task-planner-day-template'
const TASK_PATH = '/api/template-planner-task'

export function time(hours: number, minutes = 0): TimeDto {
	return { hours, minutes }
}

/** `BaseCreateEndpoint` answers 201 with the new id as the bare body — no wrapper object. */
async function postForId(api: APIRequestContext, path: string, data: object): Promise<number> {
	const response = await api.post(`${apiUrl()}${path}`, { data })
	if (!response.ok()) {
		throw new Error(
			`POST ${path} returned HTTP ${response.status()}: ${await response.text()}\n` +
				`Request body was: ${JSON.stringify(data)}`,
		)
	}
	const body = await response.text()
	const id = Number(body)
	if (!Number.isFinite(id) || id <= 0) {
		throw new Error(`POST ${path} succeeded but did not return a usable id (got '${body}')`)
	}
	return id
}

/**
 * Creates one template plus its tasks and returns the template id.
 *
 * @param api an `APIRequestContext` carrying the signed-in user's cookies. `authenticatedPage.request`
 *   is the one to pass: auth is httpOnly cookies on domain `localhost`, cookies ignore the port, and a
 *   page's request context shares its browser context's cookie jar — so it reaches `:8080` already
 *   signed in, with the context's `ignoreHTTPSErrors` applied to the self-signed dev cert.
 */
export async function createTemplate(
	api: APIRequestContext,
	template: TemplateBody,
	tasks: TemplateTaskBody[] = [],
): Promise<number> {
	const templateId = await postForId(api, TEMPLATE_PATH, template)
	for (const task of tasks) {
		await postForId(api, TASK_PATH, { ...task, templateId })
	}
	return templateId
}

export async function deleteTemplate(api: APIRequestContext, templateId: number): Promise<void> {
	const response = await api.delete(`${apiUrl()}${TEMPLATE_PATH}/${templateId}`)
	if (!response.ok()) {
		throw new Error(`DELETE ${TEMPLATE_PATH}/${templateId} returned HTTP ${response.status()}`)
	}
}

/**
 * Runs `body` with a freshly created template, and deletes it afterwards **whether or not `body`
 * threw** — so a failing assertion leaves the fixture at its three templates rather than four.
 */
export async function withTemporaryTemplate<T>(
	api: APIRequestContext,
	template: TemplateBody,
	tasks: TemplateTaskBody[],
	body: (templateId: number) => Promise<T>,
): Promise<T> {
	const templateId = await createTemplate(api, template, tasks)
	try {
		return await body(templateId)
	} finally {
		await deleteTemplate(api, templateId)
	}
}

/**
 * A template the write-path spec can create without colliding with the fixture's three.
 *
 * It deliberately carries a **background** task: none of the twelve seeded template tasks is one, so
 * `.background-task-block` is otherwise never rendered by any spec.
 */
export function writePathTemplate(seed: SeedResponse): { template: TemplateBody; tasks: TemplateTaskBody[] } {
	return {
		template: {
			name: 'E2E Write Path Template',
			isActive: true,
			suggestedForDayType: 'Workday',
			description: 'Created and deleted by a single spec. If you are seeing this, that spec died.',
			icon: 'flask',
			defaultWakeUpTime: time(7),
			defaultBedTime: time(23),
			scheduledDays: ['Monday'],
			suggestedLocation: 'Office',
			tags: ['e2e'],
		},
		tasks: [
			{
				activityId: seed.activities.bugFixing,
				startTime: time(9),
				endTime: time(11),
				isBackground: false,
				location: 'Desk',
				notes: 'Written by the e2e write-path spec.',
			},
			{
				activityId: seed.activities.featureDevelopment,
				startTime: time(11),
				endTime: time(13),
				isBackground: true,
			},
		],
	}
}
