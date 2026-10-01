import { describe, expect, it } from 'vitest'
import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'

/**
 * The to-do link's two wire spellings, pinned. The server reads `todolistId` on the request and writes
 * `todolistItemId` on the response — neither is `todoListItemId`, and for six weeks the client used
 * that on both sides. Nothing failed: the create silently dropped the link, the response always read
 * null, and completing a planner task never ticked the to-do item it was planned from.
 */

function taskJson(overrides: Record<string, unknown> = {}) {
	return {
		id: 16038,
		startTime: { hours: 15, minutes: 0 },
		endTime: { hours: 15, minutes: 30 },
		calendarId: 900,
		isBackground: false,
		isDone: false,
		activity: {
			id: 12019,
			name: 'Deep Clean Kitchen',
			role: { id: 11001, name: 'Chores', text: null, color: 'teal', icon: 'fas fa-broom' },
		},
		location: null,
		notes: null,
		importance: null,
		color: '#000000',
		status: 'NotStarted',
		...overrides,
	}
}

describe('planner task ↔ to-do item link on the wire', () => {
	it('reads the link from the response’s `todolistItemId`', () => {
		expect(PlannerTask.fromJson(taskJson({ todolistItemId: 14108 })).todoListItemId).toBe(14108)
	})

	it('reads an unlinked task as null', () => {
		expect(PlannerTask.fromJson(taskJson({ todolistItemId: null })).todoListItemId).toBeNull()
	})

	it('sends the link as `todolistId`, and only under that name', () => {
		const request = new PlannerTaskRequest()
		request.todolistId = 14108
		const body = JSON.parse(JSON.stringify(request))
		expect(body.todolistId).toBe(14108)
		expect(body).not.toHaveProperty('todoListItemId')
	})

	it('keeps the link through a response → PUT round trip, which would otherwise unlink the task', () => {
		const body = JSON.parse(JSON.stringify(PlannerTask.fromJson(taskJson({ todolistItemId: 14108 })).toRequest()))
		expect(body.todolistId).toBe(14108)
	})
})
