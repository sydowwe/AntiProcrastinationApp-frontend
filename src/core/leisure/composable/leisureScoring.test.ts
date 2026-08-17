import { describe, expect, it } from 'vitest'
import {
	MIN_SLOT_MINUTES,
	SUGGESTION_COUNT,
	isEligible,
	pickSuggestions,
	scoreCandidate,
	slotMinutesFor,
	type CandidateFacts,
	type PickerConstraints,
	type RankingContext,
} from '@/core/leisure/composable/leisureScoring.ts'
import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'

// A backlog candidate that fits the default constraints, so each test can vary one thing.
function facts(overrides: Partial<CandidateFacts> = {}): CandidateFacts {
	return {
		key: 'backlog:1',
		source: 'backlog',
		activityId: 1,
		maxUsefulMinutes: 30,
		energyLevel: EnergyLevel.Medium,
		energyIsDerived: false,
		effortType: null,
		minParticipants: 1,
		statedDurationMinutes: 30,
		readinessStatus: null,
		comfortZoneStep: null,
		requiresTravel: false,
		...overrides,
	}
}

function constraints(overrides: Partial<PickerConstraints> = {}): PickerConstraints {
	return {
		minutes: 60,
		energy: EnergyLevel.Medium,
		people: 1,
		maxCostTierId: null,
		locationTypeId: null,
		...overrides,
	}
}

function context(overrides: Partial<RankingContext> = {}): RankingContext {
	return {
		constraints: constraints(),
		lastSuggestedAt: {},
		lastCommittedEffort: null,
		now: new Date('2026-08-17T18:00:00.000Z'),
		seed: 1,
		...overrides,
	}
}

describe('hard constraints', () => {
	it('excludes a backlog activity longer than the time available', () => {
		expect(isEligible(facts({ statedDurationMinutes: 90 }), constraints({ minutes: 60 }))).toBe(false)
		expect(isEligible(facts({ statedDurationMinutes: 60 }), constraints({ minutes: 60 }))).toBe(true)
	})

	it('keeps a backlog activity that records no duration', () => {
		expect(isEligible(facts({ statedDurationMinutes: null }), constraints({ minutes: 15 }))).toBe(true)
	})

	it('excludes an activity that needs more people than are around', () => {
		expect(isEligible(facts({ minParticipants: 4 }), constraints({ people: 2 }))).toBe(false)
		expect(isEligible(facts({ minParticipants: 2 }), constraints({ people: 2 }))).toBe(true)
	})

	it('excludes a project that needs shopping first, at any amount of time', () => {
		const project = facts({ source: 'project', readinessStatus: ReadinessStatus.NeedsShopping })
		expect(isEligible(project, constraints({ minutes: 240 }))).toBe(false)
	})

	it('excludes projects below the session floor but not by their total estimate', () => {
		// 20 hours of estimate is the whole build, not one sitting — two free hours is a fine session.
		const longProject = facts({
			source: 'project',
			readinessStatus: ReadinessStatus.ReadyToStart,
			statedDurationMinutes: null,
			maxUsefulMinutes: 20 * 60,
		})
		expect(isEligible(longProject, constraints({ minutes: 120 }))).toBe(true)
		expect(isEligible(longProject, constraints({ minutes: 30 }))).toBe(false)
	})

	it('excludes bucket-list entries below the time floor, and travel ones below the higher floor', () => {
		const entry = facts({
			source: 'bucketList',
			statedDurationMinutes: null,
			maxUsefulMinutes: null,
			comfortZoneStep: 2,
		})
		expect(isEligible(entry, constraints({ minutes: 60 }))).toBe(false)
		expect(isEligible(entry, constraints({ minutes: 120 }))).toBe(true)

		const trip = facts({ ...entry, requiresTravel: true })
		expect(isEligible(trip, constraints({ minutes: 120 }))).toBe(false)
		expect(isEligible(trip, constraints({ minutes: 240 }))).toBe(true)
	})
})

describe('soft signals', () => {
	// Every pair below shares a key, so the seeded jitter is identical and only the signal differs.
	it('penalises too-demanding harder than too-easy', () => {
		const ctx = context({ constraints: constraints({ energy: EnergyLevel.Medium }) })
		const tooDemanding = scoreCandidate(facts({ energyLevel: EnergyLevel.High }), ctx)
		const tooEasy = scoreCandidate(facts({ energyLevel: EnergyLevel.Low }), ctx)
		const exact = scoreCandidate(facts({ energyLevel: EnergyLevel.Medium }), ctx)
		expect(exact).toBeGreaterThan(tooEasy)
		expect(tooEasy).toBeGreaterThan(tooDemanding)
	})

	it('prefers something that uses the free time over a filler', () => {
		const ctx = context({ constraints: constraints({ minutes: 60 }) })
		expect(scoreCandidate(facts({ statedDurationMinutes: 55 }), ctx)).toBeGreaterThan(
			scoreCandidate(facts({ statedDurationMinutes: 5 }), ctx),
		)
	})

	it('buries what was suggested today and favours what never has been', () => {
		const candidate = facts()
		const never = scoreCandidate(candidate, context())
		const shownToday = scoreCandidate(
			candidate,
			context({ lastSuggestedAt: { 'backlog:1': '2026-08-17T09:00:00.000Z' } }),
		)
		const shownLastWeek = scoreCandidate(
			candidate,
			context({ lastSuggestedAt: { 'backlog:1': '2026-08-10T09:00:00.000Z' } }),
		)
		expect(never).toBeGreaterThan(shownToday)
		expect(shownLastWeek).toBeGreaterThan(shownToday)
	})

	it('rewards a change of effort type from the last thing committed to', () => {
		const ctx = context({ lastCommittedEffort: EffortType.Mental })
		expect(scoreCandidate(facts({ effortType: EffortType.Physical }), ctx)).toBeGreaterThan(
			scoreCandidate(facts({ effortType: EffortType.Mental }), ctx),
		)
	})

	it('prefers a ready project to one still being planned', () => {
		const ctx = context()
		const ready = facts({ source: 'project', readinessStatus: ReadinessStatus.ReadyToStart })
		const planning = facts({ source: 'project', readinessStatus: ReadinessStatus.Planning })
		expect(scoreCandidate(ready, ctx)).toBeGreaterThan(scoreCandidate(planning, ctx))
	})

	it('prefers the smallest untried comfort-zone step', () => {
		const ctx = context({ constraints: constraints({ minutes: 240 }) })
		const base = { source: 'bucketList' as const, statedDurationMinutes: null, maxUsefulMinutes: null }
		// Same derived energy on both (steps 2 and 3 both map to Medium), so only the step differs.
		expect(scoreCandidate(facts({ ...base, comfortZoneStep: 2 }), ctx)).toBeGreaterThan(
			scoreCandidate(facts({ ...base, comfortZoneStep: 3 }), ctx),
		)
	})
})

describe('the draw', () => {
	function pool(): CandidateFacts[] {
		const backlog = [1, 2, 3, 4].map(id =>
			facts({ key: `backlog:${id}`, activityId: id, statedDurationMinutes: 60, maxUsefulMinutes: 60 }),
		)
		const projects = [5, 6].map(id =>
			facts({
				key: `project:${id}`,
				activityId: id,
				source: 'project',
				readinessStatus: ReadinessStatus.ReadyToStart,
				statedDurationMinutes: null,
				maxUsefulMinutes: 180,
			}),
		)
		const bucketList = [7, 8].map(id =>
			facts({
				key: `bucketList:${id}`,
				activityId: id,
				source: 'bucketList',
				comfortZoneStep: 2,
				statedDurationMinutes: null,
				maxUsefulMinutes: null,
			}),
		)
		return [...backlog, ...projects, ...bucketList]
	}

	it('never returns more than three', () => {
		const drawn = pickSuggestions(pool(), context({ constraints: constraints({ minutes: 240 }) }))
		expect(drawn).toHaveLength(SUGGESTION_COUNT)
	})

	it('holds the per-source caps across every seed', () => {
		for (let seed = 0; seed < 50; seed++) {
			const drawn = pickSuggestions(pool(), context({ constraints: constraints({ minutes: 240 }), seed }))
			expect(drawn.filter(candidate => candidate.source === 'bucketList').length).toBeLessThanOrEqual(1)
			expect(drawn.filter(candidate => candidate.source === 'project').length).toBeLessThanOrEqual(1)
		}
	})

	it('relaxes the caps rather than returning fewer cards than the pool can fill', () => {
		const twoBucketListEntries = pool().filter(candidate => candidate.source === 'bucketList')
		const drawn = pickSuggestions(twoBucketListEntries, context({ constraints: constraints({ minutes: 240 }) }))
		expect(drawn).toHaveLength(2)
	})

	it('is reproducible for a seed and varied across seeds', () => {
		const ctx = context({ constraints: constraints({ minutes: 240 }), seed: 42 })
		const first = pickSuggestions(pool(), ctx).map(candidate => candidate.key)
		expect(pickSuggestions(pool(), ctx).map(candidate => candidate.key)).toEqual(first)

		const seen = new Set<string>()
		for (let seed = 0; seed < 30; seed++) {
			for (const candidate of pickSuggestions(
				pool(),
				context({ constraints: constraints({ minutes: 240 }), seed }),
			)) {
				seen.add(candidate.key)
			}
		}
		// A deterministic top-3 would only ever surface three of the eight.
		expect(seen.size).toBeGreaterThan(SUGGESTION_COUNT)
	})

	it('ignores the order the pool arrived in', () => {
		const ctx = context({ constraints: constraints({ minutes: 240 }), seed: 7 })
		const forwards = pickSuggestions(pool(), ctx).map(candidate => candidate.key)
		const backwards = pickSuggestions([...pool()].reverse(), ctx).map(candidate => candidate.key)
		expect([...backwards].sort()).toEqual([...forwards].sort())
	})
})

describe('slotMinutesFor', () => {
	it('never books longer than the user said they had', () => {
		expect(slotMinutesFor(facts({ maxUsefulMinutes: 20 * 60 }), constraints({ minutes: 120 }))).toBe(120)
	})

	it('books the stated duration when it is shorter than the time available', () => {
		expect(slotMinutesFor(facts({ maxUsefulMinutes: 45 }), constraints({ minutes: 120 }))).toBe(45)
	})

	it('sizes an entry with no duration to the whole ask', () => {
		expect(slotMinutesFor(facts({ maxUsefulMinutes: null }), constraints({ minutes: 240 }))).toBe(240)
	})

	it('never books an unplannably short slot', () => {
		expect(slotMinutesFor(facts({ maxUsefulMinutes: 1 }), constraints({ minutes: 60 }))).toBe(MIN_SLOT_MINUTES)
	})
})
