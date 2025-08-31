<template>
<div>
	<ActivitySelectionForm ref="activitySelectionForm"
	                       :select-options-source="ActivityOptionsSource.ACTIVITY_HISTORY"></ActivitySelectionForm>
	<div class="d-flex flex-column flex-md-row mb-3">
		<VDateInput v-if="isDateRange"
		              class="mt-3 flex-1-0"
		              :label="$t('dateTime.dateFrom')"
		              :clearable="true" :display-format="formatToDate"
		              v-model="filterData.dateFrom">
		</VDateInput>
		<div v-else class="flex-1-0 d-flex flex-column flex-md-row mt-3">
			<div class="d-flex flex-1-0 ga-1 align-center">
				<VNumberInput v-model="filterData.hoursBack"
				             :min="MIN_HOURS_BACK"
				             :max="MAX_HOURS_BACK"
				             :clearable="false"
				></VNumberInput>
				<VLabel class="ml-2">{{ $t("dateTime.hoursBack") }}</VLabel>
				<v-slider
					class="flex-1-0 ml-4 mr-3"
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
				v-model="isDateRange"
				:label="$t('dateTime.dateRange')"
				hide-details
				density="compact"
			></VCheckbox>
			<VDateInput
				class="flex-1-0"
				:label="$t('dateTime.dateTo')"
				v-model="filterData.dateTo"
				:clearable="isDateRange"
				:display-format="formatToDate"
				:maxDate="new Date()">
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
import {ref, watch, reactive, onMounted} from "vue";
import {HistoryFilter} from "@/classes/History";
import {ActivityOptionsSource} from '@/classes/ActivityFormHelper';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {type ActivitySelectionFormType} from '@/classes/types/RefTypeInterfaces';
import {VDateInput} from 'vuetify/labs/components';
import {useMoment} from '@/scripts/momentHelper.ts';

const {formatToDate} = useMoment()
const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);


const MIN_HOURS_BACK = 2;
const MAX_HOURS_BACK = 72;

const filterData = reactive(new HistoryFilter());
const isDateRange = ref(false);

onMounted(() => {
	applyFilter();
});

function applyFilter() {
	Object.assign(filterData, activitySelectionForm.value.formData);
	emit("filterApplied", filterData, isDateRange.value);
}

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

const emit = defineEmits<{
	filterApplied: [filterData: HistoryFilter, isDateRange: boolean];
}>();
</script>
