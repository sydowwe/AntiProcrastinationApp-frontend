import { describe, expect, it } from 'vitest'
import { togglesLinkedTodoItem } from '@/core/home/composable/linkedTodoItemSync.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'

const { NotStarted, InProgress, Completed, Cancelled } = PlannerTaskStatus

describe('togglesLinkedTodoItem', () => {
	it('ticks the item when a linked task is completed', () => {
		expect(togglesLinkedTodoItem(7, NotStarted, Completed)).toBe(true)
		expect(togglesLinkedTodoItem(7, InProgress, Completed)).toBe(true)
	})

	it('unticks it when a completed task is reopened or skipped after all', () => {
		expect(togglesLinkedTodoItem(7, Completed, NotStarted)).toBe(true)
		expect(togglesLinkedTodoItem(7, Completed, Cancelled)).toBe(true)
	})

	it('leaves it alone for moves that never touch Completed', () => {
		expect(togglesLinkedTodoItem(7, NotStarted, InProgress)).toBe(false)
		expect(togglesLinkedTodoItem(7, InProgress, NotStarted)).toBe(false)
		expect(togglesLinkedTodoItem(7, NotStarted, Cancelled)).toBe(false)
		expect(togglesLinkedTodoItem(7, Cancelled, NotStarted)).toBe(false)
	})

	it('says nothing for a task with no linked item', () => {
		expect(togglesLinkedTodoItem(null, NotStarted, Completed)).toBe(false)
	})

	it('says nothing when the status did not move', () => {
		expect(togglesLinkedTodoItem(7, Completed, Completed)).toBe(false)
	})
})
