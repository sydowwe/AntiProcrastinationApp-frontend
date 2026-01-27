<template>
<div class="d-flex flex-column">
	<div class="d-flex flex-column flex-md-row ga-3">
		<div v-if="showFromToDoListField" class="flex-1-1 d-flex flex-column flex-md-row ga-3">
			<NullFalseTrueCheckbox label="From to-do list" v-model="formData!.isFromToDoList"
			                       :disabled="formDisabled" hide-details density="compact"></NullFalseTrueCheckbox>
			<VIdSelect v-if="formData?.isFromToDoList" class="flex-1-1" v-model="formData!.taskPriorityId" :items="filteredOptions.taskPriorityOptions"
			           hide-details density="compact"></VIdSelect>

		</div>
		<div v-if="showFromToDoListField" class="flex-1-1 d-flex flex-column flex-md-row ga-3">
			<NullFalseTrueCheckbox label="From routine to-do list" v-model="formData!.isFromRoutineToDoList"
			                       :disabled="formDisabled" hide-details density="compact"></NullFalseTrueCheckbox>
			<VIdSelect v-if="formData!.isFromRoutineToDoList" class="flex-1-1" v-model="formData!.routineTimePeriodId"
			           :items="filteredOptions.routineTimePeriodOptions" hide-details density="compact"></VIdSelect>
		</div>
	</div>
	<VRow class="my-0">
		<VCol cols="12" :lg="isInDialog ? 12 : 6" class="py-4">
			<VIdAutocomplete label="Role" v-model="formData!.roleId" :items="filteredOptions.roleOptions" :disabled="formDisabled"
			                 hide-details density="compact"></VIdAutocomplete>
		</VCol>
		<VCol cols="12" :lg="isInDialog ? 12 : 6" class="py-4">
			<VIdAutocomplete label="Category" v-model="formData!.categoryId" :items="filteredOptions.categoryOptions"
			                 :disabled="formDisabled"
			                 hide-details density="compact"></VIdAutocomplete>
		</VCol>
		<VCol cols="12" class="pt-4 pb-0">
			<InputWithButton icon="plus" color="success" @create="createNewActivity">
				<VIdAutocomplete ref="activityField" :label="(isFilter ? '' : '*') + 'Activity'" v-model="activityIdModel" :items="filteredOptions.activityOptions"
				                 :disabled="formDisabled"
				                 :required="!isFilter" :rules="!isFilter ? [requiredRule] : []"></VIdAutocomplete>
			</InputWithButton>
		</VCol>
	</VRow>
</div>

<CreateActivityDialog ref="createActivityDialog" @created="onActivityCreated"></CreateActivityDialog>
</template>

<script setup lang="ts">
import {computed, onMounted, type PropType, reactive, ref, watch} from 'vue';
import {Time} from '@/utils/Time.ts';
import {ActivityFormRequest} from '@/dtos/request/ActivityFormRequest.ts';
import {ActivityOptionsSource} from '@/dtos/enum/ActivityOptionsSource.ts';
import NullFalseTrueCheckbox from '@/components/general/inputs/NullFalseTrueCheckbox.vue';
import {filterActivityFormSelectOptions, getAllActivityFormSelectOptionsCombinations,} from '@/composables/ActivitySelectsComposition';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useActivityHistoryCrud} from '@/composables/ConcretesCrudComposable.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import InputWithButton from '@/components/general/InputWithButton.vue';
import type {VAutocomplete} from 'vuetify/components';
import {ActivityFormSelectOptions} from '@/dtos/response/ActivityFormSelectOptions.ts';
import type {ActivitySelectOptionCombination} from '@/dtos/response/ActivitySelectOptionCombination.ts';
import CreateActivityDialog from '@/components/dialogs/activity/CreateActivityDialog.vue';
import {SelectOption} from '@/dtos/response/SelectOption.ts';
import type {ActivityRequest} from '@/dtos/request/ActivityRequest.ts';


const {requiredRule} = useGeneralRules()

const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();
const {create} = useActivityHistoryCrud()
const activityField = ref<InstanceType<typeof VAutocomplete>>()
const createActivityDialog = ref<InstanceType<typeof CreateActivityDialog>>()

const props = defineProps({
	isFilter: {
		type: Boolean,
		default: false,
	},
	formDisabled: {
		type: Boolean,
		default: false,
	},
	showFromToDoListField: {
		type: Boolean,
		default: true,
	},
	isInDialog: {
		type: Boolean,
		default: false,
	},
	selectOptionsSource: {
		type: String as PropType<ActivityOptionsSource>,
		default: ActivityOptionsSource.ALL
	}
});

const allOptionsCombinations = ref<ActivitySelectOptionCombination[]>([]);
const filteredOptions = ref(new ActivityFormSelectOptions());

const formData = defineModel<ActivityFormRequest>({required: false, default: () => reactive(new ActivityFormRequest())});
const selectedActivityId = defineModel<number | null>('activityId', {default: null});

const activityIdModel = computed({
	get: () => {
		if (props.isFilter) {
			return formData.value!.activityId;
		} else {
			return selectedActivityId.value;
		}
	},
	set: (value: number | null) => {
		if (props.isFilter) {
			formData.value!.activityId = value;
		} else {
			selectedActivityId.value = value;
		}
	}
});

onMounted(async () => {
	allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(props.selectOptionsSource);
	formData.value!.activityId = formData.value!.activityId ?? null;
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value!);
});

watch(formData, () => {
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value!);
}, {deep: true})

watch(activityIdModel, (newValue) => {
	emit('activityIdChanged', newValue);
});

watch(() => formData.value!.isFromToDoList, (newValue) => {
	if (!newValue) {
		formData.value!.taskPriorityId = null;
	}
});
watch(() => formData.value!.isFromRoutineToDoList, (newValue) => {
	if (!newValue) {
		formData.value!.routineTimePeriodId = null;
	}
});

async function validate() {
	return await activityField.value?.validate()
}

async function saveActivityToHistory(startTimestamp: Date, activityLength: Time) {
	if (!activityIdModel.value) {
		showErrorSnackbar(`Please select an activity`);
	} else {
		const newId = await create(startTimestamp, activityLength, activityIdModel.value);

		if (newId) {
			showSuccessSnackbar(`Added record of activity ${getSelectedActivityName.value} to history`);
			return newId;
		} else {
			showErrorSnackbar(`Error saving record of activity ${getSelectedActivityName.value} to history`);
			return null;
		}
	}
}

function createNewActivity() {
	createActivityDialog.value?.open();
}

function onActivityCreated(request: ActivityRequest, createdId: number) {
	// Add new activity to the options
	filteredOptions.value.activityOptions.push(new SelectOption(createdId, request.name));
	// Auto-select the newly created activity
	activityIdModel.value = createdId;
}


const getSelectedRoleName = computed((): string => {
	const options = filteredOptions.value.roleOptions || [];
	return options.find(item => item.id === formData.value!.roleId)?.text || '';
});

const getSelectedCategoryName = computed((): string => {
	const options = filteredOptions.value.categoryOptions || [];
	return options.find(item => item.id === formData.value!.categoryId)?.text || '';
});

const getSelectedTaskUrgencyName = computed((): string => {
	const options = filteredOptions.value.taskPriorityOptions || [];
	return options.find(item => item.id === formData.value!.taskPriorityId)?.text || '';
});

const getSelectedRoutineTimePeriodName = computed((): string => {
	const options = filteredOptions.value.routineTimePeriodOptions || [];
	return options.find(item => item.id === formData.value!.routineTimePeriodId)?.text || '';
});

const getSelectedActivityName = computed((): string => {
	return filteredOptions.value?.activityOptions.find((item) => item.id === activityIdModel.value)?.text || '';
});

const getSelectedActivityId = computed(() => {
	return formData.value!.activityId;
});

defineExpose({
	validate,
	getSelectedActivityName,
	getSelectedActivityId,
	getSelectedRoleName,
	getSelectedCategoryName,
	getSelectedTaskUrgencyName,
	getSelectedRoutineTimePeriodName,
	saveActivityToHistory
});

const emit = defineEmits<{
	(e: "activityIdChanged", activityId: number | null): void;
}>()
</script>