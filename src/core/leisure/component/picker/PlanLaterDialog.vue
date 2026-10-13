<template>
	<div class="d-flex flex-column ga-4 py-2">
		<p class="text-body-2 text-medium-emphasis mb-0">
			{{ $t('leisure.picker.planLaterHint', { activity: activityName }) }}
		</p>
		<TimePicker
			:modelValue="startTime"
			:label="$t('leisure.picker.startAt')"
			viewMode="hour"
			color="primaryOutline"
			width="130px"
			showArrows
			hideDetails
			@update:modelValue="onPicked"
		/>
		<div class="text-body-2">
			{{ $t('leisure.picker.slotPreview', { from: startTime.getString(), to: endTime.getString() }) }}
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { isoDateInUserZone, timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { useDayReplanApi } from '@/core/dayPlanner/api/dayReplanApi.ts'

	const { activityName, slotMinutes } = defineProps<{
		activityName: string
		slotMinutes: number
	}>()

	const LAST_MINUTE_OF_DAY = 24 * 60 - 1
	const DEFAULT_OFFSET_MINUTES = 15
	const DEFAULT_GRID_MINUTES = 30

	const dialog = useDialogApi<Time>()

	// "Later today" starts at the next half hour that is not already upon the user — near midnight it
	// simply stops advancing rather than rolling into tomorrow, which this dialog cannot book.
	const initialMinutes = Math.min(
		Math.ceil((timeInUserZone().getInMinutes + DEFAULT_OFFSET_MINUTES) / DEFAULT_GRID_MINUTES) *
			DEFAULT_GRID_MINUTES,
		LAST_MINUTE_OF_DAY,
	)
	const startTime = ref(Time.fromMinutes(initialMinutes))
	// Once the user has turned the picker, a late answer from the server must not move it under their finger.
	let userPicked = false

	function onPicked(value: Time) {
		userPicked = true
		startTime.value = value
	}

	const endTime = computed(() =>
		Time.fromMinutes(Math.min(startTime.value.getInMinutes + slotMinutes, LAST_MINUTE_OF_DAY)),
	)

	// FO4: the server knows where today's free time is, so the default starts after whatever is already
	// planned. The local guess above is the floor: the slot is still "later", and lands on the picker's grid
	// unless a block ends off it. It also stays the default when the request fails or the day has no room.
	async function prefillFromFreeSlot() {
		if (initialMinutes + slotMinutes > LAST_MINUTE_OF_DAY) return
		try {
			const slot = await useDayReplanApi().fetchNextFreeSlot(
				isoDateInUserZone(),
				slotMinutes,
				{ notBeforeMinute: initialMinutes },
				{ _silent: true },
			)
			if (!userPicked) startTime.value = Time.fromMinutes(slot.startMinutesOr(initialMinutes))
		} catch {
			// a better default only; the picker already works without it
		}
	}

	void prefillFromFreeSlot()

	dialog.onConfirm(() => dialog.close(startTime.value))
</script>
