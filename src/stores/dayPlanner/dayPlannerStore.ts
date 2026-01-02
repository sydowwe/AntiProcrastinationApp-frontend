import {defineStore, type StoreGeneric} from 'pinia'
import {computed, ref} from 'vue'
import {useMoment} from '@/scripts/momentHelper.ts'
import {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts'
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
import {usePlannerStoreCore} from '@/composables/dayPlanner/usePlannerStoreCore.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import {Time} from '@/utils/Time.ts';
import {TaskSpan} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import {useTaskPlannerCrud} from '@/composables/ConcretesCrudComposable.ts';

export interface IDayPlannerStore extends IBaseDayPlannerStore<PlannerTask, PlannerTaskRequest> {
	viewedDate: Date
	viewStartDate: Date
	viewEndDate: Date
	dateTimeFromSlotIndex: (slotIndex: number) => Date
	datetimeToSlotIndex: (time?: Date) => number
}

export const useDayPlannerStore = defineStore('dayPlanner', () => {
	const {formatToTime24H} = useMoment()
	const core = usePlannerStoreCore<PlannerTask, PlannerTaskRequest>(() => new PlannerTaskRequest())
	const {patch, fetchById} = useTaskPlannerCrud()

	// Day-specific state
	const viewedDate = ref(new Date())

	// Day-specific computed
	const viewStartDate = computed(() => {
		const date = new Date(viewedDate.value)
		date.setHours(core.viewStartTime.value.hours, core.viewStartTime.value.minutes, 0, 0)
		return date
	})

	const viewEndDate = computed(() => {
		const date = new Date(viewedDate.value)

		const endHour = core.viewEndTime.value.hours
		const endMinute = core.viewEndTime.value.minutes

		if (endHour >= 24) {
			date.setDate(date.getDate() + Math.floor(endHour / 24))
			date.setHours(endHour % 24, endMinute, 0, 0)
		} else {
			date.setHours(endHour, endMinute, 0, 0)
		}
		return date
	})

	const dateTimeFromSlotIndex = computed(() => (slotIndex: number): Date => {
		const {hours, minutes} = core.slotIndexToTime.value(slotIndex)

		const date = new Date(viewedDate.value)

		if (hours >= 24) {
			date.setDate(date.getDate() + Math.floor(hours / 24))
			date.setHours(hours % 24, minutes, 0, 0)
		} else {
			date.setHours(hours, minutes, 0, 0)
		}

		return date
	})

	const datetimeToSlotIndex = computed(() => (dateTime?: Date): number => {
		const time = new Time(dateTime?.getHours(), dateTime?.getMinutes())
		return core.timeToSlotIndex.value(time)
	})

	async function updateTaskSpan(eventId: number, span: TaskSpan) {
		await patch(eventId, span)
	}

	return {
		...core,
		updateTaskSpan,
		// Day-specific
		viewedDate,
		viewStartDate,
		viewEndDate,
		dateTimeFromSlotIndex,
		datetimeToSlotIndex,
	}
}) satisfies () => IDayPlannerStore & StoreGeneric