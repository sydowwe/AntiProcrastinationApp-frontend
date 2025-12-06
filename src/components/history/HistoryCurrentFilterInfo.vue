<template>
<div class="d-flex align-center ga-2 flex-wrap">
	<VBtn
		@click="isFilterExpanded = !isFilterExpanded"
		color="secondary"
		:prepend-icon="isFilterExpanded ? 'chevron-up' : 'chevron-down'"
	>
		{{ isFilterExpanded ? 'Hide Filter' : 'Show Filter' }}
	</VBtn>
	<VBtn
		v-if="hasAnyActiveFilter"
		@click="clearAllFilters"
		variant="outlined"
		color="error"
	>
		Clear All
	</VBtn>
	<!-- Active filter badges -->
	<VChip
		v-if="filterData.activityFilter.activityId"
		closable
		@click:close="clearActivityFilter"
		color="primary"
		variant="outlined"
	>
		Activity: {{ activitySelectionForm?.getSelectedActivityName }}
	</VChip>

	<VChip
		v-if="filterData.activityFilter.roleId"
		closable
		@click:close="clearRoleFilter"
		color="primary"
		variant="outlined"
	>
		Role: {{ activitySelectionForm?.getSelectedRoleName }}
	</VChip>

	<VChip
		v-if="filterData.activityFilter.categoryId"
		closable
		@click:close="clearCategoryFilter"
		color="primary"
		variant="outlined"
	>
		Category: {{ activitySelectionForm?.getSelectedCategoryName }}
	</VChip>

	<VChip
		v-if="filterData.activityFilter.isFromToDoList === true"
		closable
		@click:close="clearFromToDoListFilter"
		color="info"
		variant="outlined"
	>
		From To-Do List{{ filterData.activityFilter.taskPriorityId ? ': ' + activitySelectionForm?.getSelectedTaskUrgencyName : '' }}
	</VChip>

	<VChip
		v-if="filterData.activityFilter.isFromToDoList === false"
		closable
		@click:close="clearFromToDoListFilter"
		color="info"
		variant="outlined"
	>
		Not From To-Do List
	</VChip>

	<VChip
		v-if="filterData.activityFilter.isFromRoutineToDoList === true"
		closable
		@click:close="clearFromRoutineToDoListFilter"
		color="info"
		variant="outlined"
	>
		From Routine To-Do{{ filterData.activityFilter.routineTimePeriodId ? ': ' + activitySelectionForm?.getSelectedRoutineTimePeriodName : '' }}
	</VChip>

	<VChip
		v-if="filterData.activityFilter.isFromRoutineToDoList === false"
		closable
		@click:close="clearFromRoutineToDoListFilter"
		color="info"
		variant="outlined"
	>
		Not From Routine To-Do
	</VChip>

	<VChip
		v-if="hasDateFilter"
		closable
		@click:close="clearDateFilter"
		color="primaryOutline"
		variant="outlined"
	>
		{{ getDateFilterText }}
	</VChip>
</div>
</template>
<script setup lang="ts">
import {computed, inject, type Ref, watch} from 'vue';
import {ActivityHistoryFilter} from '@/dtos/dto/ActivityHistoryFilter.ts';
import {useMoment} from '@/scripts/momentHelper.ts';
import type ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';

const {formatToDate} = useMoment()

const activitySelectionForm = inject<Ref<InstanceType<typeof ActivitySelectionForm> | undefined>>('activitySelectionForm');

const filterData = defineModel<ActivityHistoryFilter>({required: true});
const isDateRange = defineModel<boolean>('isDateRange', {required: true});
const isFilterExpanded = defineModel<boolean>('isFilterExpanded', {required: true});

watch(filterData, (newVal) => {
	console.log(newVal);
}, {deep: true})

const hasDateFilter = computed(() => {
	return filterData.value.dateFrom !== null || filterData.value.dateTo !== null || filterData.value.hoursBack !== 24;
});

const getDateFilterText = computed(() => {
	if (isDateRange.value) {
		const from = filterData.value.dateFrom ? formatToDate(filterData.value.dateFrom) : '';
		const to = filterData.value.dateTo ? formatToDate(filterData.value.dateTo) : '';
		return `${from} - ${to}`;
	} else {
		return `Last ${filterData.value.hoursBack}h`;
	}
});

const hasAnyActiveFilter = computed(() => {
	return filterData.value.activityFilter.activityId ||
		filterData.value.activityFilter.roleId !== null ||
		filterData.value.activityFilter.categoryId !== null ||
		filterData.value.activityFilter.isFromToDoList !== null ||
		filterData.value.activityFilter.isFromRoutineToDoList !== null ||
		hasDateFilter.value;
});

// Clear filter functions
function clearActivityFilter() {
	if (activitySelectionForm?.value) {
		filterData.value.activityFilter.activityId = null;
	}
	applyFilter();
}

function clearRoleFilter() {
	filterData.value.activityFilter.roleId = null;
	applyFilter();
}

function clearCategoryFilter() {
	filterData.value.activityFilter.categoryId = null;
	applyFilter();
}

function clearFromToDoListFilter() {
	filterData.value.activityFilter.isFromToDoList = null;
	filterData.value.activityFilter.taskPriorityId = null;
	applyFilter();
}

function clearFromRoutineToDoListFilter() {
	filterData.value.activityFilter.isFromRoutineToDoList = null;
	filterData.value.activityFilter.routineTimePeriodId = null;
	applyFilter();
}

function clearDateFilter() {
	filterData.value.dateFrom = null;
	filterData.value.dateTo = null;
	filterData.value.hoursBack = 24;
	isDateRange.value = false;
	applyFilter();
}

function clearAllFilters() {
	// Reset all filter data
	filterData.value = new ActivityHistoryFilter();
	isDateRange.value = false;

	applyFilter();
}

function applyFilter() {
	emit('filterApplied');
}

const emit = defineEmits<{
	filterApplied: [];
}>();
</script>

<style scoped>

</style>