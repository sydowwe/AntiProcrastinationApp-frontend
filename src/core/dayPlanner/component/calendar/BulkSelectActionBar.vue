<template>
	<ActionBar
		:isShown
		@cancel="emit('cancel')"
	>
		<span class="text-textMuted font-weight-medium">
			{{ $t('planner.calendar.daysSelected', { count: selectedCount }, selectedCount) }}
		</span>
		<VBtn
			variant="outlined"
			color="secondaryOutline"
			@click="emit('selectAll')"
		>
			{{ $t('planner.calendar.selectAll') }}
		</VBtn>
		<!-- A command, not a value: pinned to null so it never shows the last pick, and picking the same
			type again (a retry on the failed days the bar keeps selected) still emits. -->
		<VSelect
			:modelValue="null"
			:label="$t('planner.calendar.changeDayType')"
			:items="dayTypeOptions"
			density="compact"
			minWidth="185"
			hideDetails
			@update:modelValue="onDayTypePicked"
		/>
		<VBtn
			color="primary"
			:disabled="selectedCount === 0"
			:loading="bulkApplying"
			@click="emit('openApplyTemplate')"
		>
			{{ $t('planner.calendar.applyTemplate') }}
		</VBtn>
		<VBtn
			color="secondary"
			:disabled="selectedCount === 0"
			@click="emit('openCopyDay')"
		>
			{{ $t('planner.calendar.copyDay') }}
		</VBtn>
	</ActionBar>
</template>

<script setup lang="ts">
	import { DayType } from '@/_common/dto/enum/DayType.ts'
	import ActionBar from '@/_common/component/ActionBar.vue'
	import { useI18n } from 'vue-i18n'
	import { useActionBarFocusReturn } from '@/core/dayPlanner/composable/useActionBarFocusReturn.ts'

	const { isShown, selectedCount, bulkApplying } = defineProps<{
		isShown: boolean
		selectedCount: number
		bulkApplying: boolean
	}>()

	const emit = defineEmits<{
		cancel: []
		selectAll: []
		changeDayType: [dayType: DayType]
		openApplyTemplate: []
		openCopyDay: []
	}>()

	const { t } = useI18n()
	const dayTypeOptions = Object.values(DayType).map(v => ({ title: t(`planner.dayType.${v}`), value: v }))

	function onDayTypePicked(dayType: DayType | null) {
		if (dayType != null) emit('changeDayType', dayType)
	}

	// Returns focus to the toolbar toggle that opened the bar — it is the element that had focus when
	// the bar appeared, and unlike a calendar day it is still there after a bulk action.
	useActionBarFocusReturn(() => isShown)
</script>
