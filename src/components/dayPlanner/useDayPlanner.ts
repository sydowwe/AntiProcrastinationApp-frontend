import { ref, computed } from 'vue'
import {Time} from '@/classes/TimeUtils.ts';



const timeSlotDuration = ref(10)
const viewedDate = ref(new Date())
const viewStartTime = ref(new Time(7,30))
const viewEndTime = ref(new Time(1,30))
const timeSlots = computed<Time[]>(() => {
	const slots: Time[] = []
	const startMinutes = viewStartTime.value.getInMinutes

	let endMinutes = viewEndTime.value.getInMinutes
	if (endMinutes < startMinutes) {
		endMinutes += 24 * 60
	}

	for (let totalMins = startMinutes; totalMins <= endMinutes; totalMins += timeSlotDuration.value) {
		const hour = Math.floor(totalMins / 60) % 24
		const minute = totalMins % 60
		slots.push(new Time(hour, minute))
	}

	return slots
})
const totalGridRows = computed(() => timeSlots.value.length - 1)


export function useDayPlanner() {
	const viewStartDate = computed(() => {
		const date = new Date(viewedDate.value)
		date.setHours(viewStartTime.value.hours , viewStartTime.value.minutes, 0, 0)
		return date
	})

	const viewEndDate = computed(() => {
		const date = new Date(viewedDate.value)

		const endHour = viewEndTime.value.hours
		const endMinute = viewEndTime.value.minutes

		if (endHour >= 24) {
			date.setDate(date.getDate() + Math.floor(endHour / 24))
			date.setHours(endHour % 24, endMinute, 0, 0)
		} else {
			date.setHours(endHour, endMinute, 0, 0)
		}
		return date
	})

	const slotIndexToTime = computed(() => (index: number): string => {
		const totalMinutes = index * timeSlotDuration.value + viewStartTime.value.minutes
		const hours = Math.floor(totalMinutes / 60) + viewStartTime.value.hours
		const minutes = totalMinutes % 60

		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
	})

	const dateTimeFromSlotIndex =  computed(() =>(slotIndex: number): string => {
		const today = viewedDate.value.toLocaleDateString('en-CA')
		return `${today}T${slotIndexToTime.value(slotIndex)}:00`
	})

	// Helper functions
	const timeToSlotIndex = computed(() => (time: string): number => {
		const obj = Time.fromString(time)
		const totalMinutes = (obj.hours - viewStartTime.value.hours) * 60 + (obj.minutes - viewStartTime.value.minutes)
		return Math.floor(totalMinutes / 10)
	})

	return {
		viewedDate,
		viewStartTime,
		viewEndTime,

		viewStartDate,
		viewEndDate,

		timeSlots,
		timeSlotDuration,
		totalGridRows,

		timeToSlotIndex,
		slotIndexToTime,
		dateTimeFromSlotIndex,
	}
}