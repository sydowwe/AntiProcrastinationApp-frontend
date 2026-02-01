<template>
<div class="d-flex align-center ga-2 flex-wrap justify-space-between">
	<!-- Left side: Chips -->
	<div class="d-flex align-center ga-2 flex-wrap flex-fill">
		<!-- Active filter badges -->
		<VChip
			v-if="appliedFilter.activityFilter.activityId"
			closable
			@click:close="emit('clearActivity')"
			color="primary"
			variant="outlined"
		>
			Activity: {{ filterNames.activityName }}
		</VChip>

		<VChip
			v-if="appliedFilter.activityFilter.roleId"
			closable
			@click:close="emit('clearRole')"
			color="primary"
			variant="outlined"
		>
			Role: {{ filterNames.roleName }}
		</VChip>

		<VChip
			v-if="appliedFilter.activityFilter.categoryId"
			closable
			@click:close="emit('clearCategory')"
			color="primary"
			variant="outlined"
		>
			Category: {{ filterNames.categoryName }}
		</VChip>

		<VChip
			v-if="appliedFilter.activityFilter.isFromToDoList === true"
			closable
			@click:close="emit('clearFromToDoList')"
			color="info"
			variant="outlined"
		>
			From To-Do List{{ appliedFilter.activityFilter.taskPriorityId ? ': ' + filterNames.taskPriorityName : '' }}
		</VChip>

		<VChip
			v-if="appliedFilter.activityFilter.isFromToDoList === false"
			closable
			@click:close="emit('clearFromToDoList')"
			color="info"
			variant="outlined"
		>
			Not From To-Do List
		</VChip>

		<VChip
			v-if="appliedFilter.activityFilter.isFromRoutineToDoList === true"
			closable
			@click:close="emit('clearFromRoutineToDoList')"
			color="info"
			variant="outlined"
		>
			From Routine To-Do{{ appliedFilter.activityFilter.routineTimePeriodId ? ': ' + filterNames.routineTimePeriodName : '' }}
		</VChip>

		<VChip
			v-if="appliedFilter.activityFilter.isFromRoutineToDoList === false"
			closable
			@click:close="emit('clearFromRoutineToDoList')"
			color="info"
			variant="outlined"
		>
			Not From Routine To-Do
		</VChip>

		<VChip
			v-if="hasDateFilter"
			closable
			@click:close="emit('clearDate')"
			color="primaryOutline"
			variant="outlined"
		>
			{{ getDateFilterText }}
		</VChip>
	</div>

	<!-- Right side: Buttons -->
	<div class="d-flex align-center ga-2">
		<VBtn
			v-if="hasAnyActiveFilter"
			@click="emit('clearAll')"
			variant="outlined"
			color="error"
		>
			Clear All
		</VBtn>
		<VBtn
			@click="isFilterExpanded = !isFilterExpanded"
			color="secondary"
			:prependIcon="isFilterExpanded ? 'chevron-right' : 'chevron-left'"
		>
			{{ isFilterExpanded ? 'Hide' : 'Filter' }}
		</VBtn>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useMoment} from '@/scripts/momentHelper.ts';
import type {ActivityHistoryFilter} from '@/dtos/dto/ActivityHistoryFilter.ts';

const props = defineProps<{
	appliedFilter: ActivityHistoryFilter;
	appliedIsDateRange: boolean;
	filterNames: {
		activityName?: string;
		roleName?: string;
		categoryName?: string;
		taskPriorityName?: string;
		routineTimePeriodName?: string;
	};
}>();

const {formatToDate} = useMoment()

const isFilterExpanded = defineModel<boolean>('isFilterExpanded', {required: true});

const hasDateFilter = computed(() => {
	return props.appliedFilter.dateFrom !== null ||
		props.appliedFilter.dateTo !== null ||
		props.appliedFilter.hoursBack !== 24;
});

const getDateFilterText = computed(() => {
	if (props.appliedIsDateRange) {
		const from = props.appliedFilter.dateFrom ? formatToDate(props.appliedFilter.dateFrom) : '';
		const to = props.appliedFilter.dateTo ? formatToDate(props.appliedFilter.dateTo) : '';
		return `${from} - ${to}`;
	} else {
		return `Last ${props.appliedFilter.hoursBack}h`;
	}
});

const hasAnyActiveFilter = computed(() => {
	return props.appliedFilter.activityFilter.activityId ||
		props.appliedFilter.activityFilter.roleId !== null ||
		props.appliedFilter.activityFilter.categoryId !== null ||
		props.appliedFilter.activityFilter.isFromToDoList !== null ||
		props.appliedFilter.activityFilter.isFromRoutineToDoList !== null ||
		hasDateFilter.value;
});

const emit = defineEmits<{
	clearActivity: [];
	clearRole: [];
	clearCategory: [];
	clearFromToDoList: [];
	clearFromRoutineToDoList: [];
	clearDate: [];
	clearAll: [];
}>();
</script>

<style scoped>

</style>
