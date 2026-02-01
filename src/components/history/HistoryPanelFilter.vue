<template>
<div class="filter-container">
	<!-- Filter Info - always visible, top bar -->
	<div class="filter-info-bar">
		<HistoryCurrentFilterInfo
			:appliedFilter="appliedFilterData"
			:appliedIsDateRange="appliedIsDateRange"
			:filterNames="appliedFilterNames"
			v-model:isFilterExpanded="isFilterExpanded"
			@clearActivity="clearActivityFilter"
			@clearRole="clearRoleFilter"
			@clearCategory="clearCategoryFilter"
			@clearFromToDoList="clearFromToDoListFilter"
			@clearFromRoutineToDoList="clearFromRoutineToDoListFilter"
			@clearDate="clearDateFilter"
			@clearAll="clearAllFilters"
		></HistoryCurrentFilterInfo>
	</div>

	<!-- Filter Panel - slides in from right, full height -->
	<VExpandXTransition mode="in-out">
		<div v-if="isFilterExpanded" class="filter-panel">
			<VCard elevation="4" class="h-100 d-flex flex-column" tile>
				<!-- Header with close button -->
				<VCardTitle class="d-flex align-center justify-space-between flex-0-0">
					<span>{{ $t('filter.title') || 'Filter' }}</span>
					<VBtn
						icon="close"
						variant="text"
						size="small"
						@click="isFilterExpanded = false"
					></VBtn>
				</VCardTitle>

				<VDivider></VDivider>

				<!-- Filter Content -->
				<VCardText class="flex-fill overflow-y-auto">
					<!-- Activity Selection -->
					<div>
						<ActivitySelectionForm
							ref="activitySelectionFormRef"
							v-model="filterData.activityFilter"
							:select-options-source="ActivityOptionsSource.ACTIVITY_HISTORY"
						></ActivitySelectionForm>
					</div>

					<VDivider class="my-4"></VDivider>

					<!-- Date/Time Filters -->
					<div class="d-flex flex-column ga-3">
						<!-- Date Range Toggle -->
						<VCheckbox
							v-model="isDateRange"
							:label="$t('dateTime.dateRange')"
							hideDetails
							density="compact"
						></VCheckbox>

						<!-- Date From (only in date range mode) -->
						<VDateInput
							v-if="isDateRange"
							:label="$t('dateTime.dateFrom')"
							:clearable="true"
							:display-format="formatToDateTs"
							v-model="filterData.dateFrom"
						></VDateInput>

						<!-- Hours Back (only when not in date range mode) -->
						<div v-else class="d-flex flex-column ga-2">
							<VNumberInput
								v-model="filterData.hoursBack"
								:min="MIN_HOURS_BACK"
								:max="MAX_HOURS_BACK"
								:clearable="false"
								:label="$t('dateTime.hoursBack')"
								hideDetails
							></VNumberInput>
							<VSlider
								v-model="filterData.hoursBack"
								:min="MIN_HOURS_BACK"
								:max="MAX_HOURS_BACK"
								:step="1"
								hideDetails
							></VSlider>
						</div>

						<!-- Date To -->
						<VDateInput
							:label="$t('dateTime.dateTo')"
							v-model="filterData.dateTo"
							:clearable="isDateRange"
							:display-format="formatToDateTs"
							:maxDate="new Date()"
						></VDateInput>
					</div>
				</VCardText>

				<VDivider></VDivider>

				<!-- Actions -->
				<VCardActions class="pa-4 flex-0-0">
					<VBtn
						class="flex-fill"
						@click="applyFilter"
						color="primary"
						size="large"
					>
						{{ $t('filter.apply') || 'Apply Filter' }}
					</VBtn>
				</VCardActions>
			</VCard>
		</div>
	</VExpandXTransition>
</div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {ActivityHistoryFilter} from "@/dtos/dto/ActivityHistoryFilter.ts";
import {ActivityOptionsSource} from '@/dtos/enum/ActivityOptionsSource.ts';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {VDateInput} from 'vuetify/labs/components';
import {useMoment} from '@/scripts/momentHelper.ts';
import HistoryCurrentFilterInfo from '@/components/history/HistoryCurrentFilterInfo.vue';

const {formatToDate} = useMoment()
const formatToDateTs = formatToDate as (date: unknown) => string

const MIN_HOURS_BACK = 2;
const MAX_HOURS_BACK = 72;

// Working filter (in the panel)
const filterData = ref(new ActivityHistoryFilter());
const isDateRange = ref(false);
const isFilterExpanded = ref(false);

// Applied filter (shown in chips)
const appliedFilterData = ref(new ActivityHistoryFilter());
const appliedIsDateRange = ref(false);
const appliedFilterNames = ref<{
	activityName?: string;
	roleName?: string;
	categoryName?: string;
	taskPriorityName?: string;
	routineTimePeriodName?: string;
}>({});

// Ref for the activity selection form
const activitySelectionFormRef = ref<InstanceType<typeof ActivitySelectionForm>>();

onMounted(() => {
	applyFilter();
});

function applyFilter() {
	// Copy working filter to applied filter
	appliedFilterData.value = JSON.parse(JSON.stringify(filterData.value));
	appliedIsDateRange.value = isDateRange.value;

	// Capture filter names at the moment of applying
	appliedFilterNames.value = {
		activityName: activitySelectionFormRef.value?.getSelectedActivityName,
		roleName: activitySelectionFormRef.value?.getSelectedRoleName,
		categoryName: activitySelectionFormRef.value?.getSelectedCategoryName,
		taskPriorityName: activitySelectionFormRef.value?.getSelectedTaskUrgencyName,
		routineTimePeriodName: activitySelectionFormRef.value?.getSelectedRoutineTimePeriodName,
	};

	emit("filterApplied", filterData.value, isDateRange.value);

	// Close filter panel on mobile after applying
	if (window.innerWidth < 960) {
		isFilterExpanded.value = false;
	}
}

// Clear functions - update both working and applied filter, then apply
function clearActivityFilter() {
	filterData.value.activityFilter.activityId = null;
	appliedFilterData.value.activityFilter.activityId = null;
	emit("filterApplied", filterData.value, isDateRange.value);
}

function clearRoleFilter() {
	filterData.value.activityFilter.roleId = null;
	appliedFilterData.value.activityFilter.roleId = null;
	emit("filterApplied", filterData.value, isDateRange.value);
}

function clearCategoryFilter() {
	filterData.value.activityFilter.categoryId = null;
	appliedFilterData.value.activityFilter.categoryId = null;
	emit("filterApplied", filterData.value, isDateRange.value);
}

function clearFromToDoListFilter() {
	filterData.value.activityFilter.isFromToDoList = null;
	filterData.value.activityFilter.taskPriorityId = null;
	appliedFilterData.value.activityFilter.isFromToDoList = null;
	appliedFilterData.value.activityFilter.taskPriorityId = null;
	emit("filterApplied", filterData.value, isDateRange.value);
}

function clearFromRoutineToDoListFilter() {
	filterData.value.activityFilter.isFromRoutineToDoList = null;
	filterData.value.activityFilter.routineTimePeriodId = null;
	appliedFilterData.value.activityFilter.isFromRoutineToDoList = null;
	appliedFilterData.value.activityFilter.routineTimePeriodId = null;
	emit("filterApplied", filterData.value, isDateRange.value);
}

function clearDateFilter() {
	const newFilter = new ActivityHistoryFilter();
	filterData.value.dateFrom = newFilter.dateFrom;
	filterData.value.dateTo = newFilter.dateTo;
	filterData.value.hoursBack = newFilter.hoursBack;
	appliedFilterData.value.dateFrom = newFilter.dateFrom;
	appliedFilterData.value.dateTo = newFilter.dateTo;
	appliedFilterData.value.hoursBack = newFilter.hoursBack;
	isDateRange.value = false;
	appliedIsDateRange.value = false;
	emit("filterApplied", filterData.value, isDateRange.value);
}

function clearAllFilters() {
	// Reset both working and applied filter data
	filterData.value = new ActivityHistoryFilter();
	appliedFilterData.value = new ActivityHistoryFilter();
	appliedFilterNames.value = {};
	isDateRange.value = false;
	appliedIsDateRange.value = false;
	emit("filterApplied", filterData.value, isDateRange.value);
}

watch(
	() => filterData.value.dateTo,
	(newValue) => {
		if (filterData.value.dateFrom !== null && newValue !== null && filterData.value.dateFrom > newValue) {
			filterData.value.dateFrom = newValue;
		}
	}
);

watch(
	() => filterData.value.dateFrom,
	(newValue) => {
		if (newValue !== null && filterData.value.dateTo !== null && newValue > filterData.value.dateTo) {
			filterData.value.dateTo = newValue;
		}
	}
);

const emit = defineEmits<{
	filterApplied: [filterData: ActivityHistoryFilter, isDateRange: boolean];
}>();
</script>

<style scoped>
.filter-container {
	position: relative;
	width: 100%;
}

.filter-info-bar {
	width: 100%;
	padding: 1rem;
}

/* When filter is expanded on desktop, add padding to prevent overlap */
@media (min-width: 960px) {
	.filter-info-bar {
		padding: 1.5rem 2rem;
	}

	/* Add right padding when filter panel is open */
	.filter-container:has(.filter-panel) .filter-info-bar {
		padding-right: 470px; /* 450px panel + 20px margin */
	}
}

.filter-panel {
	position: fixed;
	top: 64px;
	right: 0;
	width: 100vw;
	height: calc(100dvh - 64px);
	z-index: 1000;
}

@media (min-width: 960px) {
	.filter-panel {
		width: 450px;
		z-index: 999;
	}
}
</style>
