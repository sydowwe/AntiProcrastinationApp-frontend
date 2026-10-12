import { describe, expect, it } from 'vitest'
import { WelcomeBack } from '@/core/home/dto/response/WelcomeBack.ts'
import { FreshStartResult } from '@/core/home/dto/response/FreshStartResult.ts'
import {
	BUILT_IN_SKIP_REASONS,
	BuiltInSkipReason,
	parseBuiltInSkipReason,
} from '@/core/dayPlanner/dto/enum/BuiltInSkipReason.ts'

// The body the API's WelcomeBackTests asserts on (`Card_CarriesThePile`), so a renamed field on either side
// fails here rather than as an empty card on home.
const card = {
	awayFrom: '2030-03-04T18:00:00Z',
	returnedAt: '2030-03-12T10:00:00Z',
	daysAway: 8,
	wasMarkedAway: false,
	overdueTodos: {
		count: 4,
		preview: [
			{ id: 1, name: 'todo-march-1', date: '2030-03-01' },
			{ id: 2, name: 'todo-march-8', date: '2030-03-08' },
			{ id: 3, name: 'todo-march-10', date: '2030-03-10' },
		],
	},
	pastTasks: { count: 2, preview: [{ id: 7, name: 'work', date: '2030-03-04' }] },
	brokenRoutines: [
		{ id: 9, text: 'Daily-broken', color: '#abcdef', canFreeze: false },
		{ id: 10, text: 'Weekly', color: '#123456', canFreeze: true },
	],
	unreadNotifications: 3,
}

describe('welcome-back on the wire (FO5)', () => {
	it('reads the card', () => {
		const parsed = WelcomeBack.fromJson(card)
		expect(parsed.overdueTodos.count).toBe(4)
		expect(parsed.overdueTodos.preview.map(i => i.name)).toEqual(['todo-march-1', 'todo-march-8', 'todo-march-10'])
		expect(parsed.pastTasks.preview[0]!.date).toBe('2030-03-04')
		expect(parsed.brokenRoutines[0]!.text).toBe('Daily-broken')
		expect(parsed.brokenRoutines.map(r => r.canFreeze)).toEqual([false, true])
		expect(WelcomeBack.fromJson({ ...card, brokenRoutines: [{ id: 9 }] }).brokenRoutines[0]!.canFreeze).toBe(false)
		expect(parsed.unreadNotifications).toBe(3)
		expect(parsed.isEmpty).toBe(false)
	})

	it('treats a card with nothing on it as a greeting', () => {
		expect(WelcomeBack.fromJson({ daysAway: 5 }).isEmpty).toBe(true)
	})

	it('knows when a fresh start changed nothing', () => {
		expect(FreshStartResult.fromJson({ undoToken: 'x' }).changedAnything).toBe(false)
		expect(FreshStartResult.fromJson({ undoToken: 'x', closedTaskIds: [7] }).changedAnything).toBe(true)
	})

	it("parses the server's away skip reason but never offers it", () => {
		expect(parseBuiltInSkipReason('away')).toBe(BuiltInSkipReason.Away)
		expect(BUILT_IN_SKIP_REASONS).not.toContain(BuiltInSkipReason.Away)
	})
})
