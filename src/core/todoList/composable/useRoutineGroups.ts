import { computed, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify/framework'
import { useRoutineTimePeriodCrud } from '@/core/todoList/api/timePeriodApi.ts'
import type { TimePeriodRequest } from '@/core/todoList/dto/request/TimePeriodRequest.ts'
import type { RoutineTodoListGroupedList } from '@/core/todoList/dto/response/routine/RoutineTodoListGroupedList.ts'

/**
 * Owns the grouped list itself plus everything that only cares about which groups exist and
 * which are visible — the group selector, the hide-done-per-group URL state and the weekly
 * review's pause/reduce-frequency handlers (both mutate `groupedItems[].timePeriod`).
 */
export function useRoutineGroups(isNewWeek: Ref<boolean>) {
	const route = useRoute()
	const router = useRouter()
	const { smAndDown } = useDisplay()
	const { update: updateTimePeriod, changeTimePeriodVisibility } = useRoutineTimePeriodCrud()

	const groupedItems = ref([] as RoutineTodoListGroupedList[])

	const hideDoneGroupIds = computed({
		get: (): number[] => {
			const val = route.query.hideDone
			if (!val) return []
			return (Array.isArray(val) ? val : [val]).map(Number)
		},
		set: (val: number[]) =>
			router.replace({ query: { ...route.query, hideDone: val.length ? val.map(String) : undefined } }),
	})

	function updateHideDone(groupId: number, val: boolean) {
		const current = hideDoneGroupIds.value
		if (val) {
			hideDoneGroupIds.value = current.includes(groupId) ? current : [...current, groupId]
		} else {
			hideDoneGroupIds.value = current.filter(id => id !== groupId)
		}
	}

	const groupSelectItems = computed(() =>
		groupedItems.value.map(g => ({ title: g.timePeriod.text, value: g.timePeriod.id as number })),
	)

	const visibleGroupIds = computed(() =>
		groupedItems.value.filter(g => !g.timePeriod.isHidden).map(g => g.timePeriod.id as number),
	)

	const visibleGroups = computed(() => groupedItems.value.filter(g => !g.timePeriod.isHidden))

	const singleVisibleGroupId = computed(() => visibleGroupIds.value[0] ?? null)

	const reviewEligibleGroups = computed(() =>
		groupedItems.value.filter(g => !g.timePeriod.isHidden && g.timePeriod.totalPeriodsElapsed > 0),
	)
	const showWeeklyReview = computed(() => isNewWeek.value && reviewEligibleGroups.value.length > 0)

	async function handleReviewPause(timePeriodId: number) {
		await changeTimePeriodVisibility(timePeriodId)
		const group = groupedItems.value.find(g => g.timePeriod.id === timePeriodId)
		if (group) group.timePeriod.isHidden = true
	}

	async function handleReviewReduceFrequency(timePeriodId: number, request: TimePeriodRequest) {
		await updateTimePeriod(timePeriodId, request)
		const group = groupedItems.value.find(g => g.timePeriod.id === timePeriodId)
		if (group) Object.assign(group.timePeriod, request)
	}

	async function onGroupSelectUpdate(newVal: number | number[]) {
		if (smAndDown.value) {
			const newId = newVal as number
			if (newId == null) return
			for (const group of groupedItems.value) {
				group.timePeriod.isHidden = group.timePeriod.id !== newId
			}
		} else {
			const newIds = newVal as number[]
			const currentIds = visibleGroupIds.value
			const toToggle = [
				...currentIds.filter(id => !newIds.includes(id)),
				...newIds.filter(id => !currentIds.includes(id)),
			]
			for (const id of toToggle) {
				const group = groupedItems.value.find(g => g.timePeriod.id === id)
				if (group) group.timePeriod.isHidden = !group.timePeriod.isHidden
			}
		}
	}

	return {
		smAndDown,
		groupedItems,
		hideDoneGroupIds,
		updateHideDone,
		groupSelectItems,
		visibleGroupIds,
		visibleGroups,
		singleVisibleGroupId,
		reviewEligibleGroups,
		showWeeklyReview,
		handleReviewPause,
		handleReviewReduceFrequency,
		onGroupSelectUpdate,
	}
}
