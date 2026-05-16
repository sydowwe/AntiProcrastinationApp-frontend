<template>
	<ActionBar
		:isShown
		@cancel="emit('cancel')"
	>
		<span class="text-textMuted font-weight-medium">
			{{ selectedCount }} day{{ selectedCount !== 1 ? 's' : '' }} selected
		</span>
		<VBtn
			variant="outlined"
			color="secondaryOutline"
			@click="emit('selectAll')"
		>
			Select All
		</VBtn>
		<VSelect
			label="Change day type"
			:items="dayTypeOptions"
			density="compact"
			minWidth="185"
			hideDetails
			@update:modelValue="emit('changeDayType', $event)"
		/>
		<VBtn
			color="primary"
			:disabled="selectedCount === 0"
			:loading="bulkApplying"
			@click="emit('openApplyTemplate')"
		>
			Apply Template
		</VBtn>
		<VBtn
			color="secondary"
			:disabled="selectedCount === 0"
			@click="emit('openCopyDay')"
		>
			Copy Day
		</VBtn>
	</ActionBar>
</template>

<script setup lang="ts">
	import { DayType } from '@/dtos/enum/DayType.ts'
	import ActionBar from '@/components/general/ActionBar.vue'

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

	const dayTypeOptions = Object.values(DayType).map(v => ({ title: v, value: v }))
</script>
