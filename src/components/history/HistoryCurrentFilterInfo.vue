<template>
	<div class="d-flex align-center ga-2 flex-wrap justify-space-between">
		<!-- Left side: Chips -->
		<div class="d-flex align-center ga-2 flex-wrap flex-fill">
			<!-- Active filter badges -->
			<VChip
				v-if="appliedFilter.activityFilter.activityId"
				closable
				color="primary"
				variant="outlined"
				@click:close="emit('clearActivity')"
			>
				Activity: {{ filterNames.activityName }}
			</VChip>

			<VChip
				v-if="appliedFilter.activityFilter.roleId"
				closable
				color="primary"
				variant="outlined"
				@click:close="emit('clearRole')"
			>
				Role: {{ filterNames.roleName }}
			</VChip>

			<VChip
				v-if="appliedFilter.activityFilter.categoryId"
				closable
				color="primary"
				variant="outlined"
				@click:close="emit('clearCategory')"
			>
				Category: {{ filterNames.categoryName }}
			</VChip>

			<VChip
				v-if="appliedFilter.activityFilter.isFromToDoList === true"
				closable
				color="info"
				variant="outlined"
				@click:close="emit('clearFromToDoList')"
			>
				From To-Do List{{
					appliedFilter.activityFilter.taskPriorityId ? ': ' + filterNames.taskPriorityName : ''
				}}
			</VChip>

			<VChip
				v-if="appliedFilter.activityFilter.isFromToDoList === false"
				closable
				color="info"
				variant="outlined"
				@click:close="emit('clearFromToDoList')"
			>
				Not From To-Do List
			</VChip>

			<VChip
				v-if="appliedFilter.activityFilter.isFromRoutineToDoList === true"
				closable
				color="info"
				variant="outlined"
				@click:close="emit('clearFromRoutineToDoList')"
			>
				From Routine To-Do{{
					appliedFilter.activityFilter.routineTimePeriodId ? ': ' + filterNames.routineTimePeriodName : ''
				}}
			</VChip>

			<VChip
				v-if="appliedFilter.activityFilter.isFromRoutineToDoList === false"
				closable
				color="info"
				variant="outlined"
				@click:close="emit('clearFromRoutineToDoList')"
			>
				Not From Routine To-Do
			</VChip>

			<VChip
				v-if="hasDateFilter"
				closable
				color="primaryOutline"
				variant="outlined"
				@click:close="emit('clearDate')"
			>
				{{ getDateFilterText }}
			</VChip>
		</div>

		<!-- Right side: Buttons -->
		<div class="d-flex align-center ga-2">
			<VBtn
				v-if="hasAnyActiveFilter"
				variant="outlined"
				color="error"
				@click="emit('clearAll')"
			>
				Clear All
			</VBtn>
			<VBtn
				color="secondary"
				:prependIcon="isFilterExpanded ? 'chevron-right' : 'chevron-left'"
				@click="isFilterExpanded = !isFilterExpanded"
			>
				{{ isFilterExpanded ? 'Hide' : 'Filter' }}
			</VBtn>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useMoment } from '@/utils/momentHelper.ts'
	import type { ActivityHistoryFilter } from '@/dtos/request/activityHistory/ActivityHistoryFilter.ts'

	const props = defineProps<{
		appliedFilter: ActivityHistoryFilter
		appliedIsDateRange: boolean
		filterNames: {
			activityName?: string
			roleName?: string
			categoryName?: string
			taskPriorityName?: string
			routineTimePeriodName?: string
		}
	}>()

	const emit = defineEmits<{
		clearActivity: []
		clearRole: []
		clearCategory: []
		clearFromToDoList: []
		clearFromRoutineToDoList: []
		clearDate: []
		clearAll: []
	}>()

	const isFilterExpanded = defineModel<boolean>('isFilterExpanded', { required: true })

	const { formatToDate } = useMoment()

	const hasDateFilter = computed(() => {
		return (
			props.appliedFilter.dateFrom !== null ||
			props.appliedFilter.dateTo !== null ||
			props.appliedFilter.hoursBack !== 24
		)
	})

	const getDateFilterText = computed(() => {
		if (props.appliedIsDateRange) {
			const from = props.appliedFilter.dateFrom ? formatToDate(props.appliedFilter.dateFrom) : ''
			const to = props.appliedFilter.dateTo ? formatToDate(props.appliedFilter.dateTo) : ''
			return `${from} - ${to}`
		} else {
			return `Last ${props.appliedFilter.hoursBack}h`
		}
	})

	const hasAnyActiveFilter = computed(() => {
		return (
			props.appliedFilter.activityFilter.activityId ||
			props.appliedFilter.activityFilter.roleId !== null ||
			props.appliedFilter.activityFilter.categoryId !== null ||
			props.appliedFilter.activityFilter.isFromToDoList !== null ||
			props.appliedFilter.activityFilter.isFromRoutineToDoList !== null ||
			hasDateFilter.value
		)
	})
</script>

<style scoped></style>
