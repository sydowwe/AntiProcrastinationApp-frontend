import { computed, ref } from 'vue'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import { fromMinutes } from '@/_common/utils/formatDuration.ts'
import { useActivityBacklogProfileCrud } from '@/core/leisure/api/activityBacklogProfileApi.ts'
import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'

/**
 * Temptation bundling (Milkman, Minson & Volpp 2014): a want-to activity attached to a should-do
 * raises follow-through on the should-do. The want-to side comes from the `leisure` module.
 *
 * Of leisure's three profile kinds only the **backlog** is a usable reward. A bucket-list entry is a
 * one-off with travel and a savings goal attached, and a project is itself a long-running effort —
 * neither is claimable in the minute after ticking a task off, which is the whole mechanism. The
 * backlog is the repeatable, short, do-it-tonight list, and it carries `durationMinutes`, so the
 * offer can prefill a timer with a length the user already committed to.
 *
 * A backlog profile's `id` **is** its `activityId` (see `ActivityBacklogProfile.id`), so the pairing
 * stored on a todo item is an activity id and nothing here needs a second lookup.
 *
 * Cross-module contact is limited to leisure's `api/` and `dto/`, per CLAUDE.md.
 */

// Module-scoped: the todo list renders one chip per item, and every one of them needs this list.
// Sharing the in-flight promise turns what would be N requests per page into exactly one.
const profiles = ref<ActivityBacklogProfile[]>([])
let loadPromise: Promise<void> | null = null

export function useLeisurePairing() {
	const { fetchAll } = useActivityBacklogProfileCrud()

	/** Idempotent. Safe to call from every consumer's `onMounted`. */
	function ensureLoaded(): Promise<void> {
		// `_silent`: this is decoration for a list the user opened to see their tasks. A leisure
		// backlog that fails to load should leave the chips off, not throw an error toast over
		// something the user did not ask for.
		loadPromise ??= fetchAll({ _silent: true })
			.then(result => {
				profiles.value = result
			})
			.catch(() => {
				// Clear the memo so the next mount retries instead of caching the failure forever.
				loadPromise = null
			})
		return loadPromise
	}

	/** Drops the memo — call after the leisure backlog itself has been edited. */
	async function refresh(): Promise<void> {
		loadPromise = null
		await ensureLoaded()
	}

	function pairingFor(activityId: number | null | undefined): ActivityBacklogProfile | undefined {
		if (activityId == null) return undefined
		return profiles.value.find(profile => profile.activityId === activityId)
	}

	/**
	 * `VIdSelect` shape (`itemValue="id"`, `itemTitle="text"`). The duration rides along in the label
	 * because picking a reward you cannot actually claim tonight defeats the point.
	 */
	const pairingOptions = computed<SelectOption[]>(() =>
		[...profiles.value]
			.sort((a, b) => a.activity.name.localeCompare(b.activity.name))
			.map(
				profile =>
					new SelectOption(
						profile.activityId,
						profile.durationMinutes > 0
							? `${profile.activity.name} · ${fromMinutes(profile.durationMinutes)}`
							: profile.activity.name,
					),
			),
	)

	return { ensureLoaded, refresh, pairingFor, pairingOptions, profiles }
}
