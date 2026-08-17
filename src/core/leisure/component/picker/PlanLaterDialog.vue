<template>
	<div class="d-flex flex-column ga-4 py-2">
		<p class="text-body-2 text-medium-emphasis mb-0">
			{{ $t('leisure.picker.planLaterHint', { activity: activityName }) }}
		</p>
		<TimePicker
			v-model="startTime"
			:label="$t('leisure.picker.startAt')"
			viewMode="hour"
			color="primaryOutline"
			width="130px"
			showArrows
			hideDetails
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
	import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'

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

	const endTime = computed(() =>
		Time.fromMinutes(Math.min(startTime.value.getInMinutes + slotMinutes, LAST_MINUTE_OF_DAY)),
	)

	dialog.onConfirm(() => dialog.close(startTime.value))
</script>
