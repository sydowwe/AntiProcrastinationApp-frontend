import { onMounted, ref, watch, type Ref } from 'vue'
import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
import { useActivityBacklogProfileCrud } from '@/core/leisure/api/activityBacklogProfileApi.ts'
import { useActivityBucketListProfileCrud } from '@/core/leisure/api/activityBucketListProfileApi.ts'
import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
import { useActivityExpectedCostTierApi, useActivityLocationTypeApi } from '@/core/leisure/api/activityLookupApi.ts'
import { ActivityBacklogProfileFilter } from '@/core/leisure/dto/request/ActivityBacklogProfileFilter.ts'
import { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'
import { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'
import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
import type { ActivityBucketListProfile } from '@/core/leisure/dto/response/ActivityBucketListProfile.ts'
import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
import type { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
import {
	BUCKET_LIST_MIN_MINUTES,
	PROJECT_MIN_MINUTES,
	comfortStepAsEnergy,
	difficultyAsEnergy,
	pickSuggestions,
	type CandidateFacts,
	type PickerConstraints,
} from '@/core/leisure/composable/leisureScoring.ts'
import { readSuggestionHistory } from '@/core/leisure/composable/suggestionHistory.ts'

/**
 * Turns the three profile tables into three suggestions.
 *
 * The pool is fetched from the endpoints that already exist — `POST /<entity>/filtered-table` — with
 * every hard constraint those filters *can* express pushed down into them (cost tier, location type,
 * readiness). The ranking then happens here, because no existing endpoint can rank across the three
 * sources, and none of them knows what the picker showed yesterday.
 *
 * That is a compromise, and a bounded one: `CANDIDATE_PAGE_SIZE` is the ceiling on how much of each
 * table this will pull, so a user with thousands of backlog rows would silently be ranked over the
 * first few hundred. Moving the draw server-side is the ask in `prompts/leisure/backend/D1-backend.md`;
 * the seam is this file and nothing else.
 */

/**
 * How much of each table one draw is willing to pull. Comfortably above any realistic personal
 * backlog, and low enough that the request stays small. It is a ceiling, not a page — the picker
 * never paginates.
 */
const CANDIDATE_PAGE_SIZE = 200

export interface LeisureSuggestion extends CandidateFacts {
	activity: ActivityInfo
	/**
	 * The one source-specific fact worth a chip: where a backlog activity happens, what kind of
	 * experience a bucket-list entry is, which area a project belongs to.
	 */
	contextLabel: string | null
}

function backlogSuggestion(profile: ActivityBacklogProfile): LeisureSuggestion {
	const duration = profile.durationMinutes > 0 ? profile.durationMinutes : null
	return {
		key: `backlog:${profile.activityId}`,
		source: 'backlog',
		activityId: profile.activityId,
		activity: profile.activity,
		maxUsefulMinutes: duration,
		energyLevel: profile.energyLevel,
		energyIsDerived: false,
		effortType: profile.effortType,
		minParticipants: profile.minParticipants,
		statedDurationMinutes: duration,
		readinessStatus: null,
		comfortZoneStep: null,
		requiresTravel: false,
		contextLabel: profile.locationType.text || null,
	}
}

function projectSuggestion(profile: ActivityProjectProfile): LeisureSuggestion {
	return {
		key: `project:${profile.activityId}`,
		source: 'project',
		activityId: profile.activityId,
		activity: profile.activity,
		maxUsefulMinutes: profile.estimatedHours > 0 ? Math.round(profile.estimatedHours * 60) : null,
		energyLevel: difficultyAsEnergy(profile.difficultyLevel),
		energyIsDerived: true,
		effortType: null,
		minParticipants: null,
		statedDurationMinutes: null,
		readinessStatus: profile.readinessStatus,
		comfortZoneStep: null,
		requiresTravel: false,
		contextLabel: profile.projectArea || null,
	}
}

function bucketListSuggestion(profile: ActivityBucketListProfile): LeisureSuggestion {
	return {
		key: `bucketList:${profile.activityId}`,
		source: 'bucketList',
		activityId: profile.activityId,
		activity: profile.activity,
		maxUsefulMinutes: null,
		energyLevel: comfortStepAsEnergy(profile.comfortZoneStep),
		energyIsDerived: true,
		effortType: null,
		minParticipants: null,
		statedDurationMinutes: null,
		readinessStatus: null,
		comfortZoneStep: profile.comfortZoneStep,
		requiresTravel: profile.requiresTravel,
		contextLabel: profile.experienceType.text || null,
	}
}

/**
 * Cost tiers are user-editable lookup rows, so "no more expensive than X" has to be resolved through
 * `sortOrder` — the field that exists for exactly this — into the set of acceptable ids, which is
 * what the existing filter takes.
 */
export function costTierIdsUpTo(tiers: readonly LookupResponse[], maxTierId: number | null): number[] | null {
	if (maxTierId === null) return null
	const ordered = [...tiers].sort((a, b) => String(a.sortOrder).localeCompare(String(b.sortOrder)))
	const cutoff = ordered.findIndex(tier => tier.id === maxTierId)
	// An id that is not in the list any more (a deleted tier still sitting in a bookmarked URL) must
	// not silently become "free only" — treat it as no cost constraint at all.
	if (cutoff === -1) return null
	return ordered.slice(0, cutoff + 1).map(tier => tier.id)
}

export interface LeisurePicker {
	suggestions: Ref<LeisureSuggestion[]>
	loading: Ref<boolean>
	/**
	 * Candidates fetched, before the hard constraints. Distinguishes the two empty states: 0 means
	 * nothing is filed at all, non-zero with no suggestions means something needs relaxing.
	 */
	poolCount: Ref<number>
	/**
	 * The most recent pool fetch failed. Distinct from an empty pool: without this, a network error
	 * renders as "you have nothing filed yet", which blames the user for the server's problem.
	 */
	loadFailed: Ref<boolean>
	costTierOptions: Ref<LookupResponse[]>
	locationTypeOptions: Ref<LookupResponse[]>
}

export function useLeisurePicker(constraints: Ref<PickerConstraints>, seed: Ref<number>): LeisurePicker {
	const { fetchFilteredTable: fetchBacklog } = useActivityBacklogProfileCrud()
	const { fetchFilteredTable: fetchProjects } = useActivityProjectProfileCrud()
	const { fetchFilteredTable: fetchBucketList } = useActivityBucketListProfileCrud()
	const { fetchAll: fetchCostTiers } = useActivityExpectedCostTierApi()
	const { fetchAll: fetchLocationTypes } = useActivityLocationTypeApi()

	const suggestions = ref<LeisureSuggestion[]>([])
	const loading = ref(true)
	const poolCount = ref(0)
	const loadFailed = ref(false)
	const costTierOptions = ref<LookupResponse[]>([])
	const locationTypeOptions = ref<LookupResponse[]>([])

	const pool = ref<LeisureSuggestion[]>([])
	// What the last fetch was made under. Only the fields that change the *request* belong in it:
	// energy and party size are ranked and filtered locally, so changing them must not cost a round
	// trip, and neither must a reroll.
	let poolSignature: string | null = null
	// Guards against an older fetch finishing after a newer one and overwriting the pool.
	let fetchToken = 0

	function signatureOf(current: PickerConstraints): string {
		return [
			current.minutes >= PROJECT_MIN_MINUTES ? 'p' : '-',
			current.minutes >= BUCKET_LIST_MIN_MINUTES ? 'b' : '-',
			current.maxCostTierId ?? '',
			current.locationTypeId ?? '',
		].join('|')
	}

	function backlogRequest(current: PickerConstraints): FilteredTableRequest<ActivityBacklogProfileFilter> {
		const filter = new ActivityBacklogProfileFilter()
		filter.expectedCostTierIds = costTierIdsUpTo(costTierOptions.value, current.maxCostTierId)
		filter.locationTypeIds = current.locationTypeId === null ? null : [current.locationTypeId]
		// `maxDurationMinutes` is deliberately NOT set here even though the filter has it: rows with no
		// duration recorded (0) would be indistinguishable from rows that genuinely fit, and dropping
		// them server-side would hide a new user's whole backlog. `isEligible` decides instead.
		return new FilteredTableRequest(CANDIDATE_PAGE_SIZE, 1, [], true, filter)
	}

	function projectRequest(): FilteredTableRequest<ActivityProjectProfileFilter> {
		const filter = new ActivityProjectProfileFilter()
		// "Needs shopping" is an errand, not a suggestion — excluded before it crosses the wire.
		filter.readinessStatuses = [ReadinessStatus.ReadyToStart, ReadinessStatus.Planning]
		return new FilteredTableRequest(CANDIDATE_PAGE_SIZE, 1, [], true, filter)
	}

	function bucketListRequest(): FilteredTableRequest<ActivityBucketListProfileFilter> {
		// Nothing on this filter maps to a picker constraint; the whole (small) list is the pool.
		return new FilteredTableRequest(CANDIDATE_PAGE_SIZE, 1, [], false, new ActivityBucketListProfileFilter())
	}

	async function fetchPool(): Promise<void> {
		const current = constraints.value
		const token = ++fetchToken
		loading.value = true
		try {
			// A source that cannot contribute under the current time budget is not requested at all —
			// at 30 minutes free, this is one request rather than three.
			const [backlog, projects, bucketList] = await Promise.all([
				fetchBacklog(backlogRequest(current)),
				current.minutes >= PROJECT_MIN_MINUTES ? fetchProjects(projectRequest()) : Promise.resolve(null),
				current.minutes >= BUCKET_LIST_MIN_MINUTES
					? fetchBucketList(bucketListRequest())
					: Promise.resolve(null),
			])
			if (token !== fetchToken) return
			loadFailed.value = false
			pool.value = [
				...backlog.items.map(backlogSuggestion),
				...(projects?.items ?? []).map(projectSuggestion),
				...(bucketList?.items ?? []).map(bucketListSuggestion),
			]
			poolSignature = signatureOf(current)
		} catch {
			if (token !== fetchToken) return
			// The axios interceptor has already told the user. Leave the previous pool in place rather
			// than blanking the cards, and flag the failure so an empty one is not read as "you have
			// nothing filed". Clearing the signature makes the next constraint change retry.
			poolSignature = null
			loadFailed.value = true
		} finally {
			if (token === fetchToken) loading.value = false
		}
	}

	function redraw(): void {
		const history = readSuggestionHistory()
		const context = {
			constraints: constraints.value,
			lastSuggestedAt: history.suggestedAt,
			lastCommittedEffort: history.lastCommittedEffort,
			now: new Date(),
			seed: seed.value,
		}
		poolCount.value = pool.value.length
		suggestions.value = pickSuggestions(pool.value, context)
	}

	async function ensurePool(): Promise<void> {
		if (poolSignature !== signatureOf(constraints.value)) {
			await fetchPool()
		}
	}

	onMounted(async () => {
		// Awaited before the first pool fetch, not alongside it: the cost filter is built from the
		// tiers' `sortOrder`, so a fetch made without them would silently ignore a cost constraint
		// that arrived in the URL. Failures are swallowed rather than propagated — the lookups only
		// populate two optional selects, and letting them reject here would leave the whole view
		// stuck on its skeleton.
		await Promise.all([
			fetchCostTiers()
				.then(tiers => (costTierOptions.value = tiers))
				.catch(() => undefined),
			fetchLocationTypes()
				.then(types => (locationTypeOptions.value = types))
				.catch(() => undefined),
		])
		await fetchPool()
		redraw()
	})

	watch(
		constraints,
		async () => {
			await ensurePool()
			redraw()
		},
		{ deep: true },
	)
	watch(seed, redraw)

	return {
		suggestions,
		loading,
		poolCount,
		loadFailed,
		costTierOptions,
		locationTypeOptions,
	}
}
