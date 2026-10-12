import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Time } from '@/_common/dto/dto/Time.ts'
import { fetchEstimateFit } from '@/core/todoList/api/todoListItemApi.ts'
import type { EstimateFit, EstimateFitGroup } from '@/core/todoList/dto/response/EstimateFit.ts'

/**
 * F3-01: how this user's to-do estimates compared with what happened, keyed on the item itself. Replaces the
 * activity-keyed `useEstimateCalibration`, which compared a per-sitting mean of the activity's whole history with a
 * per-item estimate. Routine items need no read of their own: since F2-06 each one arrives with its typical
 * occurrence on the routine response (`RoutineTodoListItemEntity.typicalTime`), and only the wording below is shared.
 *
 * Per instance, not module-scoped: the list view owns the read and hands each row its figure, so nothing outlives
 * the view into another account's session.
 */
export function useEstimateFit() {
	const fit = ref<EstimateFit | null>(null)
	let latestRequest = 0

	/** Re-reads after anything that changes logged time. A slower, older answer never overwrites a newer one. */
	async function reload(): Promise<void> {
		const request = ++latestRequest
		const result = await fetchEstimateFit('list')
		if (result && request === latestRequest) fit.value = result
	}

	function groupForList(listId: number): EstimateFitGroup | null {
		return fit.value?.groups.find(group => group.key === listId) ?? null
	}

	/** Under a minute reads as nothing, the way the chip's own `getNice` would render it. */
	function loggedTimeFor(itemId: number): Time | null {
		const seconds = fit.value?.loggedSecondsByItemId.get(itemId)
		if (!seconds) return null
		const time = Time.fromSeconds(seconds)
		return time.isNotZero() ? time : null
	}

	return { reload, groupForList, loggedTimeFor }
}

/**
 * The shared wording rule for FO8: say what happened to the estimate, never what the person is like. A ratio that
 * rounds to 1.0 is said in words, because "1.0× the estimate" reads as a measurement of the user.
 */
export function useEstimateFitWording() {
	const { t, locale } = useI18n()

	function formatRatio(ratio: number): string {
		return new Intl.NumberFormat(locale.value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ratio)
	}

	function isAboutAsEstimated(ratio: number): boolean {
		return Math.round(ratio * 10) === 10
	}

	function describeLogged(group: EstimateFitGroup): string {
		return isAboutAsEstimated(group.loggedRatio)
			? t('toDoList.estimateFit.loggedAsEstimated', { count: group.sampleCount })
			: t('toDoList.estimateFit.logged', { ratio: formatRatio(group.loggedRatio), count: group.sampleCount })
	}

	function describePlanned(group: EstimateFitGroup): string | null {
		if (group.plannedRatio === null) return null
		return isAboutAsEstimated(group.plannedRatio)
			? t('toDoList.estimateFit.plannedAsEstimated', { count: group.plannedSampleCount })
			: t('toDoList.estimateFit.planned', {
					ratio: formatRatio(group.plannedRatio),
					count: group.plannedSampleCount,
				})
	}

	/**
	 * F2-06: a routine item's typical occurrence, said of the item ("usually takes about 18m"). The count takes
	 * plural forms, unlike the to-do group's: it starts at three, and Slovak changes form between 4 and 5.
	 */
	function describeRoutineTypical(time: Time, sampleCount: number): string {
		return t('toDoList.estimateFit.routineTypical', { time: time.getNice, count: sampleCount }, sampleCount)
	}

	/** The short form, for a routine item with no estimate to set it beside. */
	function routineTypicalChip(time: Time): string {
		return t('toDoList.estimateFit.routineTypicalChip', { time: time.getNice })
	}

	return { describeLogged, describePlanned, describeRoutineTypical, routineTypicalChip }
}
