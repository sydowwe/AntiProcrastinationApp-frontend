import { describe, expect, it } from 'vitest'
import { BuiltInSkipReason } from '@/core/dayPlanner/dto/enum/BuiltInSkipReason.ts'
import { buildBuiltInLookup, groupSkipReasons, type SkipReasonEntry } from '@/core/dayPlanner/utils/skipReasonGroups.ts'

/**
 * The grouping rule written down in skipReasonGroups.ts. The case that matters most is the one that
 * must NOT merge: a wrong merge reports a reason the user never gave.
 */
const lookup = buildBuiltInLookup([
	{ noTime: 'Nestihol som', notRelevant: 'Už nie je aktuálne', noEnergy: 'Nemal som energiu' },
	{ noTime: 'Ran out of time', notRelevant: 'Not relevant any more', noEnergy: 'No energy for it' },
])

/** One skip per string, as the day line feeds it. */
function texts(...reasons: (string | null)[]): SkipReasonEntry[] {
	return reasons.map(reason => ({ reason, reasonKey: null, count: 1 }))
}

describe('groupSkipReasons', () => {
	it('merges a built-in label given as text in two locales into one group', () => {
		const { groups } = groupSkipReasons(texts('Ran out of time', 'Nestihol som', 'ran out of time '), lookup)
		expect(groups).toEqual([{ kind: 'builtIn', reason: BuiltInSkipReason.NoTime, count: 3 }])
	})

	it('merges a key group with text that folds onto the same built-in (B1 step 1)', () => {
		const summary = groupSkipReasons(
			[
				{ reason: null, reasonKey: BuiltInSkipReason.NoTime, count: 2 },
				{ reason: 'ran out of time', reasonKey: null, count: 1 },
				{ reason: null, reasonKey: null, count: 1 },
			],
			lookup,
		)
		expect(summary).toEqual({
			total: 4,
			groups: [{ kind: 'builtIn', reason: BuiltInSkipReason.NoTime, count: 3 }],
			withoutReasonCount: 1,
		})
	})

	it('merges free text only on an exact match after trim, whitespace and case', () => {
		const { groups } = groupSkipReasons(texts('Tired', ' tired', 'TIRED  ', 'too tired'), lookup)
		expect(groups).toEqual([
			{ kind: 'text', text: 'Tired', count: 3 },
			{ kind: 'text', text: 'too tired', count: 1 },
		])
	})

	it('adds up server groups that differ only by case', () => {
		const { groups } = groupSkipReasons(
			[
				{ reason: 'Tired', reasonKey: null, count: 2 },
				{ reason: 'tired', reasonKey: null, count: 3 },
			],
			lookup,
		)
		expect(groups).toEqual([{ kind: 'text', text: 'Tired', count: 5 }])
	})

	it('treats composed and decomposed diacritics as the same text', () => {
		const composed = 'Deň bol dlhý'
		const { groups } = groupSkipReasons(texts(composed, composed.normalize('NFD')), lookup)
		expect(groups).toEqual([{ kind: 'text', text: composed, count: 2 }])
	})

	it('counts null and blank as "without a reason", never as a group', () => {
		const summary = groupSkipReasons(texts(null, '   ', 'Meeting ran long'), lookup)
		expect(summary.total).toBe(3)
		expect(summary.withoutReasonCount).toBe(2)
		expect(summary.groups).toEqual([{ kind: 'text', text: 'Meeting ran long', count: 1 }])
	})

	it('orders by count, and keeps first-seen order on a tie', () => {
		const { groups } = groupSkipReasons(texts('b', 'a', 'c', 'c'), lookup)
		expect(groups.map(g => (g.kind === 'text' ? g.text : g.reason))).toEqual(['c', 'b', 'a'])
	})

	it('does not recognise a built-in by similarity', () => {
		const { groups } = groupSkipReasons(texts('Ran out of time again'), lookup)
		expect(groups).toEqual([{ kind: 'text', text: 'Ran out of time again', count: 1 }])
	})
})
