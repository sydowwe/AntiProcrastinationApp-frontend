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
	              v-model:dateValue="filterData.dateFrom">
	</MyDatePicker>
	<div v-else class="flex-1-0 d-flex flex-column flex-md-row mt-3">
		<div class="d-flex flex-1-0 align-center">
			<VTextField
				class="flex-0-1"
				v-model="filterData.hoursBack"
				:min="2"
				:max="72"
				type="number"
				:clearable="false"
				hide-details
			></VTextField>
			<VLabel class="ml-2">{{ i18n.t("dateTime.hoursBack") }}</VLabel>
			<v-slider
				class="flex-1-0 mx-2"
				v-model="filterData.hoursBack"
				:min="2"
				:max="72"
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
			v-model:dateValue="filterData.dateTo"
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
//populate selects composition
import {ref, computed, watch, reactive} from "vue";
import MyDatePicker from '@/components/MyDatePicker.vue';
import {HistoryFilter} from "@/classes/History";
import {HistoryRecord} from "@/classes/HistoryRecord";
import {IdLabelOption} from "@/classes/IdLabelOption";
import {importDefaults} from '@/compositions/Defaults';

const {i18n} = importDefaults();

const filterData = reactive(new HistoryFilter());
const selectOptions = reactive({
	role: [] as IdLabelOption[],
	category: [] as IdLabelOption[],
	activity: [] as IdLabelOption[],
});

const dateRange = ref(false);

populateSelects("role", "/role/get-all-options");
populateSelects("category", "/category/get-all-options");
populateSelects("activity", "/activity/get-all-options");
applyFilter();

watch(
	() => filterData.roleId,
	(newValue) => {
		console.log(newValue);
		updateCategoriesAndActivities();
	}
);
watch(
	() => filterData.categoryId,
	(newValue) => {
		console.log(newValue);
		updateRolesAndActivities();
	}
);
watch(
	() => filterData.dateTo,
	(newValue) => {
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
// watch(()=> filterData.activityId,(newValue)=>{
//     console.log(newValue);
// });


function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
	axios
		.post(url)
		.then((response) => {
			selectOptions[dataKey] = IdLabelOption.listFromObjects(response.data);
		})
		.catch((error) => {
			console.log(error);
		});
}

function updateCategoriesAndActivities() {
	filterData.categoryId = null;
	filterData.activityId = null;
	if (filterData.roleId) {
		populateSelects(
			"category",
			`/category/get-options-by-role/${filterData.roleId}`
		);
	} else {
		selectOptions.category = [];
		selectOptions.activity = [];
	}
}

function updateRolesAndActivities() {
	filterData.roleId = null;
	filterData.activityId = null;
	if (filterData.categoryId) {
		populateSelects(
			"role",
			`/role/get-options-by-category/${filterData.categoryId}`
		);
	} else {
		selectOptions.role = [];
		selectOptions.activity = [];
	}
}

// function updateActivities() {
//     filterData.activityId = null;
//     if (filterData.categoryId) {
//         populateSelects('activity', `/activity/get-options-by-category/${filterData.categoryId}`);
//     } else {
//         selectOptions.activity = [];
//     }
// }
function applyFilter() {
	let filter = {...filterData};
	filter.dateTo?.setHours(23,59,59,59);
	if (dateRange.value) {
		filter.hoursBack = null;
		filter.dateFrom?.setHours(0,0,0,1);
	} else {
		filter.dateFrom = null;
	}
	console.log(filter);
	axios
		.post(`/history/filter`, filter)
		.then((response) => {
			emit("filterApplied", HistoryRecord.listFromObjects(response.data));
		})
		.catch((error) => {
			console.log(error);
		});
}

const emit = defineEmits<{
	filterApplied: [records: HistoryRecord[]];
}>();
</script>
