<template>
<VRow class="justify-center my-2" align="center">
	<VCol cols="12" lg="5" md="6">
		<v-autocomplete
			label="Role"
			v-model="filterData.roleId"
			:items="selectOptions.role"
			hide-details
		></v-autocomplete>
	</VCol>
	<VCol cols="12" lg="7" md="6">
		<v-autocomplete
			label="Category"
			v-model="filterData.categoryId"
			:items="selectOptions.category"
			hide-details
		></v-autocomplete>
	</VCol>
</VRow>
<div class="d-flex flex-md-row flex-column-reverse my-3 mb-2 mb-md-3">
	<v-checkbox
		class="flex-grow-0 pr-md-3 mx-auto mt-2 mt-md-0"
		label="From to-do list"
		v-model="filterData.isFromToDoList"
		hide-details
	></v-checkbox>
	<v-autocomplete
		label="Activity"
		v-model="filterData.activityId"
		class="flex-grow-1"
		:items="selectOptions.activity"
		hide-details
	></v-autocomplete>
</div>
<div class="d-flex flex-column flex-md-row mb-3">
	<MyDatePicker v-if="dateRange"
	              class="mt-3 flex-1-0"
	              :label="i18n.t('dateTime.dateFrom')"
	              :clearable="true"
	              v-model="filterData.dateFrom">
	</MyDatePicker>
	<div v-else class="flex-1-0 d-flex flex-column flex-md-row mt-3">
		<div class="d-flex flex-1-0 align-center">
			<VBtn
				variant="text"
				icon
				@click="quickChangeHoursBack(-1)"
				style="border-radius: 3px"
				density="comfortable"
				@mousedown="continuousQuickChangeHoursBack(-1)"
				@mouseup="endContinuousQuickChange"
			>
				<VIcon icon="chevron-left" size="large" class="clickableIcon"></VIcon>
			</VBtn>
			<VTextField
				class="flex-0-1"
				v-model="filterData.hoursBack"
				:min="MIN_HOURS_BACK"
				:max="MAX_HOURS_BACK"
				type="number"
				:clearable="false"
				@input="constrainHoursBack"
				hide-details
				hide-spin-buttons
			></VTextField>
			<VBtn
				variant="text"
				icon
				@click="quickChangeHoursBack(1)"
				style="border-radius: 3px"
				density="comfortable"
				@mousedown="continuousQuickChangeHoursBack(1)"
				@mouseup="endContinuousQuickChange"
			>
				<VIcon icon="chevron-right" size="large" class="clickableIcon"></VIcon>
			</VBtn>
			<VLabel class="ml-2">{{ i18n.t("dateTime.hoursBack") }}</VLabel>
			<v-slider
				class="flex-1-0 mx-2"
				v-model="filterData.hoursBack"
				:min="MIN_HOURS_BACK"
				:max="MAX_HOURS_BACK"
				:step="1"
				hide-details
			></v-slider>
		</div>
	</div>
	<div class="flex-1-0 d-flex align-center mb-3 mb-md-0 mt-md-3">
		<VCheckbox
			class="flex-0-1 mx-2 mx-md-3"
			v-model="dateRange"
			:label="i18n.t('dateTime.dateRange')"
			hide-details
			density="compact"
		></VCheckbox>
		<MyDatePicker
			class="flex-1-0"
			:label="i18n.t('dateTime.dateTo')"
			v-model="filterData.dateTo"
			:clearable="dateRange"
			:maxDate="new Date()">
		</MyDatePicker>
	</div>
</div>
<VRow class="justify-center my-0">
	<VCol cols="12" lg="4" md="5">
		<VBtn class="w-100" @click="applyFilter" color="primary">Filter</VBtn>
	</VCol>
</VRow>
</template>

<script setup lang="ts">
import {ref, watch, reactive} from "vue";
import MyDatePicker from '@/components/MyDatePicker.vue';
import {HistoryFilter, HistoryGroupedByDate} from "@/classes/History";
import {ActivityFormSelects, ActivityFormRequest} from '@/classes/Activity';
import {useI18n} from 'vue-i18n';
import {SelectOption} from '@/classes/SelectOption';

const i18n = useI18n();
const MIN_HOURS_BACK = 2;
const MAX_HOURS_BACK = 72;

const filterData = reactive(new HistoryFilter());
const selectOptions = ref(new ActivityFormSelects());
const dateRange = ref(false);

applyFilter();

updateFilterSelects();

function updateFilterSelects() {
	axios
		.post('/history/update-filter-selects', ActivityFormRequest.fromFilter(filterData))
		.then((response) => {
			console.log(response.data);
			selectOptions.value = ActivityFormSelects.fromObject(response.data);
		})
		.catch((error) => {
			console.log(error);
		});
}


function applyFilter() {
	let filter = {...filterData, dateTo: filterData.dateTo ? new Date(filterData.dateTo) : null};
	filter.dateTo?.setHours(23, 59, 59, 999);
	if (dateRange.value) {
		filter.hoursBack = null;
		filter.dateFrom?.setHours(0, 0, 1, 0);
	} else {
		filter.dateFrom = null;
	}
	axios
		.post(`/history/filter`, filter)
		.then((response) => {
			emit("filterApplied", HistoryGroupedByDate.listFromObjects(response.data));
		})
		.catch((error) => {
			console.log(error);
		});
}

watch(() => filterData.activityId, () => {
	updateFilterSelects();
});
watch(
	() => filterData.roleId,	() => {
		updateFilterSelects();
	}
);
watch(
	() => filterData.categoryId,	() => {
		updateFilterSelects();
	}
);
watch(
	() => filterData.dateTo,
	(newValue) => {
		console.log(newValue)
		if (filterData.dateFrom !== null && newValue !== null && filterData.dateFrom > newValue) {
			filterData.dateFrom = newValue;
		}
	}
);
watch(
	() => filterData.dateFrom,
	(newValue) => {
		if (newValue !== null && filterData.dateTo !== null && newValue > filterData.dateTo) {
			filterData.dateTo = newValue;
		}
	}
);



let mouseDownTimeout = 0;

function continuousQuickChangeHoursBack(value: number) {
	mouseDownTimeout = setTimeout(() => {
		quickChangeHoursBack(value);
		continuousQuickChangeHoursBack(value);
	}, 150);
}

function endContinuousQuickChange() {
	clearTimeout(mouseDownTimeout);
}

function quickChangeHoursBack(value: number) {
	if (filterData.hoursBack) {
		switch (checkValidHoursBackValue(filterData.hoursBack + value)) {
			case -1:
				filterData.hoursBack = MAX_HOURS_BACK;
				break;
			case 1:
				filterData.hoursBack = MIN_HOURS_BACK;
				break;
			case 0:
				filterData.hoursBack += value;
				break;
		}
	}
}

function constrainHoursBack() {
	if (filterData.hoursBack) {
		switch (checkValidHoursBackValue(filterData.hoursBack)) {
			case -1:
				filterData.hoursBack = MIN_HOURS_BACK;
				break;
			case 1:
				filterData.hoursBack = MAX_HOURS_BACK;
				break;
		}
	}
}

function checkValidHoursBackValue(value: number) {
	if (value < MIN_HOURS_BACK) {
		return -1;
	} else if (value > MAX_HOURS_BACK) {
		return 1;
	} else {
		return 0;
	}
}

const emit = defineEmits<{
	filterApplied: [records: HistoryGroupedByDate[]];
}>();
</script>
