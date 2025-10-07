<template>
<div class="d-flex flex-column">
	<div class="d-flex flex-column flex-md-row ga-3">
		<div v-if="showFromToDoListField" class="flex-1-1 d-flex flex-column flex-md-row ga-3">
			<NullFalseTrueCheckbox label="From to-do list" v-model="formData.isFromToDoList"
			                       :disabled="formDisabled" hide-details></NullFalseTrueCheckbox>
			<VIdSelect v-if="formData.isFromToDoList" class="flex-1-1" v-model="formData.taskUrgencyId" :items="filteredOptions.taskUrgencyOptions"
			           hide-details></VIdSelect>

		</div>
		<div v-if="showFromToDoListField" class="flex-1-1 d-flex flex-column flex-md-row ga-3">
			<NullFalseTrueCheckbox label="From routine to-do list" v-model="formData.isFromRoutineToDoList"
			                       :disabled="formDisabled" hide-details></NullFalseTrueCheckbox>
			<VIdSelect v-if="formData.isFromRoutineToDoList" class="flex-1-1" v-model="formData.routineTimePeriodId"
			           :items="filteredOptions.routineTimePeriodOptions" hide-details></VIdSelect>
		</div>
	</div>
	<VRow class="my-0">
		<VCol cols="12" :lg="isInDialog ? 12 : 6" class="py-4">
			<VIdAutocomplete label="Role" v-model="formData.roleId" :items="filteredOptions.roleOptions" :disabled="formDisabled"
			                 hide-details class="pb-1"></VIdAutocomplete>
		</VCol>
		<VCol cols="12" :lg="isInDialog ? 12 : 6" class="py-4">
			<VIdAutocomplete label="Category" v-model="formData.categoryId" :items="filteredOptions.categoryOptions"
			                 :disabled="formDisabled"
			                 hide-details class="pb-1"></VIdAutocomplete>
		</VCol>
		<VCol cols="12" class="py-4">
			<InputWithButton icon="plus" color="success" @create="createNewActivity">
				<VIdAutocomplete label="*Activity" v-model="activityIdModel" :items="filteredOptions.activityOptions"
				                 :disabled="formDisabled"
				                 :required="!isFilter" :rules="!isFilter ? [requiredRule] : []" class="pb-1"></VIdAutocomplete>
			</InputWithButton>
		</VCol>
	</VRow>
</div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted, type PropType} from 'vue';
import {Time} from '@/classes/TimeUtils';
import {
	ActivityFormRequest,
	ActivityFormSelectOptions,
	ActivityOptionsSource,
	ActivitySelectOptionCombination
} from '@/classes/ActivityFormHelper';
import NullFalseTrueCheckbox from '@/components/general/inputs/NullFalseTrueCheckbox.vue';
import {
	filterActivityFormSelectOptions,
	// getAllActivityFormSelectOptions,
	getAllActivityFormSelectOptionsCombinations,
	// useActivitySelectOptionsFiltered
} from '@/composables/ActivitySelectsComposition';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import router from '@/plugins/router.ts';
import {useActivityHistoryCrud} from '@/composables/ConcretesCrudComposable.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import InputWithButton from '@/components/general/InputWithButton.vue';


const {requiredRule} = useGeneralRules()

const {showErrorSnackbar, showSnackbar} = useSnackbar();
const {create} = useActivityHistoryCrud()

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

const formData = defineModel<ActivityFormRequest>({default: new ActivityFormRequest()});
const selectedActivityId = defineModel<number | null>('activityId',{default: null});

const activityIdModel = computed({
	get: () => {
		if (props.isFilter) {
			return formData.value.activityId;
		} else {
			return selectedActivityId.value;
		}
	},
	set: (value: number | null) => {
		if (props.isFilter) {
			formData.value.activityId = value;
		} else {
			selectedActivityId.value = value;
		}
	}
});

onMounted(async () => {
	allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(props.selectOptionsSource);
	formData.value.activityId = formData.value.activityId ?? null;
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value);
});

watch(() => formData.value, async (newVal) => {
	newVal.activityId = activityIdModel.value;
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, newVal);
}, {deep: true})

watch(() => activityIdModel.value, (newValue) => {
	emit('activityIdChanged', newValue);
});

watch(() => formData.value.isFromToDoList, (newValue) => {
	if (!newValue) {
		formData.value.taskUrgencyId = null;
	}
});
watch(() => formData.value.isFromRoutineToDoList, (newValue) => {
	if (!newValue) {
		formData.value.routineTimePeriodId = null;
	}
});

function validate() {
	if (activityIdModel.value != null) {
		return true;
	} else {
		showErrorSnackbar(`Please select an activity`);
		return false;
	}
}

async function saveActivityToHistory(startTimestamp: Date, activityLength: Time) {
	if (!activityIdModel.value) {
		showErrorSnackbar(`Please select an activity`);
	} else {
		const newId = await create(startTimestamp, activityLength, activityIdModel.value);

		if (newId) {
			showSnackbar(`Added record of activity ${getSelectedActivityName.value} to history`, {color: 'success'});
			return newId;
		} else {
			showErrorSnackbar(`Error saving record of activity ${getSelectedActivityName.value} to history`);
			return null;
		}
	}
}

function createNewActivity() {
	router.push('/create-new-activity');
}


const getSelectedRoleName = computed((): string => {
	const options = filteredOptions.value.roleOptions || [];
	return options.find(item => item.id === formData.value.roleId)?.text || '';
});

const getSelectedCategoryName = computed((): string => {
	const options = filteredOptions.value.categoryOptions || [];
	return options.find(item => item.id === formData.value.categoryId)?.text || '';
});

const getSelectedTaskUrgencyName = computed((): string => {
	const options = filteredOptions.value.taskUrgencyOptions || [];
	return options.find(item => item.id === formData.value.taskUrgencyId)?.text || '';
});

const getSelectedRoutineTimePeriodName = computed((): string => {
	const options = filteredOptions.value.routineTimePeriodOptions || [];
	return options.find(item => item.id === formData.value.routineTimePeriodId)?.text || '';
});

const getSelectedActivityName = computed((): string => {
	return filteredOptions.value?.activityOptions.find((item) => item.id === activityIdModel.value)?.text || '';
});

const getSelectedActivityId = computed(() => {
	return formData.value.activityId;
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