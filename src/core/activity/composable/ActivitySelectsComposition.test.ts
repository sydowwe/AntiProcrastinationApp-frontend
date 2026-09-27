import { describe, expect, it } from 'vitest'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'
import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
import {
	dropNarrowingThatExcludes,
	filterActivityFormSelectOptions,
} from '@/core/activity/composable/ActivitySelectsComposition.ts'

const WORK = new SelectOption(1, 'Work')
const HEALTH = new SelectOption(2, 'Health & Fitness')
const DEEP_WORK = new SelectOption(10, 'Deep Work')
const ERRANDS = new SelectOption(11, 'Errands')

const DESK_RESEARCH = new ActivitySelectOptionCombination(100, 'Desk Research', WORK, DEEP_WORK)
const GROCERIES = new ActivitySelectOptionCombination(101, 'Grocery Shopping', HEALTH, ERRANDS)
const MATRIX = [DESK_RESEARCH, GROCERIES]

function form(roleId: number | null, categoryId: number | null) {
	return Object.assign(new ActivityFormRequest(), { roleId, categoryId })
}

describe('dropNarrowingThatExcludes', () => {
	it('clears a role that excludes the activity, so the activity survives the next filter pass', () => {
		const data = form(HEALTH.id, null)
		dropNarrowingThatExcludes(MATRIX, data, DESK_RESEARCH.id)
		data.activityId = DESK_RESEARCH.id

		expect(data.roleId).toBeNull()
		const options = filterActivityFormSelectOptions(MATRIX, data)
		expect(options.activityOptions.map(o => o.id)).toContain(DESK_RESEARCH.id)
	})

	it('clears a category that excludes the activity', () => {
		const data = form(null, ERRANDS.id)
		dropNarrowingThatExcludes(MATRIX, data, DESK_RESEARCH.id)
		expect(data.categoryId).toBeNull()
	})

	it('keeps a narrowing the activity satisfies', () => {
		const data = form(WORK.id, DEEP_WORK.id)
		dropNarrowingThatExcludes(MATRIX, data, DESK_RESEARCH.id)
		expect(data.roleId).toBe(WORK.id)
		expect(data.categoryId).toBe(DEEP_WORK.id)
	})

	it('leaves the narrowing alone for a null or unknown activity', () => {
		const data = form(HEALTH.id, ERRANDS.id)
		dropNarrowingThatExcludes(MATRIX, data, null)
		dropNarrowingThatExcludes(MATRIX, data, 999)
		expect(data.roleId).toBe(HEALTH.id)
		expect(data.categoryId).toBe(ERRANDS.id)
	})
})
