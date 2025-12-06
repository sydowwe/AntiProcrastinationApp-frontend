<template>
<div>
	<HistoryCurrentFilterInfo class="mb-5" v-model="filterData" v-model:isFilterExpanded="isFilterExpanded"
	                          v-model:isDateRange="isDateRange"></HistoryCurrentFilterInfo>
	<VExpandTransition>
		<div v-show="isFilterExpanded">
			<ActivitySelectionForm ref="activitySelectionForm" v-model="filterData.activityFilter"
			                       :select-options-source="ActivityOptionsSource.ACTIVITY_HISTORY"></ActivitySelectionForm>
		</div>
	</VExpandTransition>
	<div class="my-2 d-flex flex-column flex-md-row">
		<VDateInput v-if="isDateRange"
		            class="flex-1-0"
		            :label="$t('dateTime.dateFrom')"
		            :clearable="true" :display-format="formatToDate"
		            v-model="filterData.dateFrom">
		</VDateInput>
		<div v-else class="flex-1-0 d-flex flex-column flex-md-row ">
			<div class="d-flex flex-1-0 ga-1 align-center">
				<VNumberInput v-model="filterData.hoursBack"
				              :min="MIN_HOURS_BACK"
				              :max="MAX_HOURS_BACK"
				              :clearable="false"
				              max-width="150px"
				              hideDetails
				></VNumberInput>
				<v-slider
					class="flex-1-0 ml-4 mr-3"
					:label="$t('dateTime.hoursBack')"
					v-model="filterData.hoursBack"
					:min="MIN_HOURS_BACK"
					:max="MAX_HOURS_BACK"
					:step="1"
					hideDetails
				></v-slider>
			</div>
		</div>
		<div class="flex-1-0 d-flex align-center">
			<VCheckbox
				class="flex-0-1 mx-2 mx-md-3"
				v-model="isDateRange"
				:label="$t('dateTime.dateRange')"
				hideDetails
				density="compact"
			></VCheckbox>
			<VDateInput
				class="flex-1-0"
				:label="$t('dateTime.dateTo')"
				v-model="filterData.dateTo"
				:clearable="isDateRange"
				:display-format="formatToDate"
				:maxDate="new Date()"
				hideDetails
			>
			</VDateInput>
		</div>
	</div>
	<VRow class="justify-center my-0">
		<VCol cols="12" lg="4" md="5">
			<VBtn class="w-100" @click="applyFilter" color="primary">Filter</VBtn>
		</VCol>
	</VRow>
</div>
</template>

<script setup lang="ts">
import {onMounted, provide, ref, watch} from "vue";
import {ActivityHistoryFilter} from "@/dtos/dto/ActivityHistoryFilter.ts";
import {ActivityOptionsSource} from '@/dtos/enum/ActivityOptionsSource.ts';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {VDateInput} from 'vuetify/labs/components';
import {useMoment} from '@/scripts/momentHelper.ts';
import HistoryCurrentFilterInfo from '@/components/history/HistoryCurrentFilterInfo.vue';

const {formatToDate} = useMoment()
const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
provide('activitySelectionForm', activitySelectionForm);


const MIN_HOURS_BACK = 2;
const MAX_HOURS_BACK = 72;

const filterData = ref(new ActivityHistoryFilter());
const isDateRange = ref(false);
const isFilterExpanded = ref(false);

onMounted(() => {
	applyFilter();
});

function applyFilter() {
	console.log(filterData.value)
	emit("filterApplied", filterData.value, isDateRange.value);
}

watch(
	() => filterData.value.dateTo,
	(newValue) => {
		console.log(newValue)
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
