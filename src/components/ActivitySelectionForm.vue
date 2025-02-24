<template>
<VRow class="justify-center" align="center" noGutters>
	<VCol v-if="showFromToDoListField" cols="auto" class="pb-0 pb-md-4">
		<NullFalseTrueCheckbox label="From to-do list" v-model="formData.isFromToDoList"
		                       :disabled="formDisabled"></NullFalseTrueCheckbox>
	</VCol>
	<VCol v-if="showFromToDoListField" v-show="formData.isFromToDoList" cols="12" md="5" lg="3" class="pt-1 pb-5 pb-md-4">
		<VIdSelect v-model="formData.taskUrgencyId" :items="filteredOptions.taskUrgencyOptions" hide-details></VIdSelect>
	</VCol>
	<VCol v-if="showFromToDoListField" cols="auto" class="pb-0 pb-md-4">
		<NullFalseTrueCheckbox label="From routine to-do list" v-model="formData.isFromRoutineToDoList"
		                       :disabled="formDisabled"></NullFalseTrueCheckbox>
	</VCol>
	<VCol v-if="showFromToDoListField" v-show="formData.isFromRoutineToDoList" cols="12" md="5" lg="3" class="pt-1 pb-5 pb-md-4">
		<VIdSelect v-model="formData.routineTimePeriodId" :items="filteredOptions.routineTimePeriodOptions" hide-details></VIdSelect>
	</VCol>
	<VCol cols="12" class="pt-1">
		<VRow>
			<VCol cols="12" :lg="isInDialog ? 12 : 6">
				<VIdAutocomplete label="Role" v-model="formData.roleId" :items="filteredOptions.roleOptions" :disabled="formDisabled"
				                 hide-details></VIdAutocomplete>
			</VCol>
			<VCol cols="12" :lg="isInDialog ? 12 : 6">
				<VIdAutocomplete label="Category" v-model="formData.categoryId" :items="filteredOptions.categoryOptions"
				                 :disabled="formDisabled"
				                 hide-details></VIdAutocomplete>
			</VCol>
			<VCol cols="12">
				<VIdAutocomplete label="Activity" v-model="formData.activityId" :items="filteredOptions.activityOptions"
				                 :disabled="formDisabled"
				                 hide-details></VIdAutocomplete>
			</VCol>
		</VRow>
	</VCol>
	<VCol cols="auto" class="mt-4">
		<VBtn @click="createNewActivity()" color="primary">Vytvoriť novú aktivitu</VBtn>
	</VCol>
</VRow>
</template>

<script setup lang="ts">

import {ref, computed, watch, onMounted, PropType} from 'vue';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {importDefaults} from '@/compositions/Defaults';
import {addActivityToHistory} from '@/compositions/SaveToHistoryComposition';
import {
	ActivityFormRequest,
	ActivityFormSelectOptions,
	ActivityOptionsSource,
	ActivitySelectOptionCombination
} from '@/classes/ActivityFormHelper';
import NullFalseTrueCheckbox from '@/components/NullFalseTrueCheckbox.vue';
import {
	filterActivityFormSelectOptions,
	// getAllActivityFormSelectOptions,
	getAllActivityFormSelectOptionsCombinations,
	// useActivitySelectOptionsFiltered
} from '@/compositions/ActivitySelectsComposition';

const {router, showErrorSnackbar, showSnackbar} = importDefaults();


const props = defineProps({
	formDisabled: {
		type: Boolean,
		default: false,
	},
	activityId: {
		type: Number as PropType<number | null>,
		default: null,
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

const allOptions = ref(new ActivityFormSelectOptions());
const allOptionsCombinations = ref<ActivitySelectOptionCombination[]>([]);
const filteredOptions = ref(new ActivityFormSelectOptions());

const formData = ref(new ActivityFormRequest());
onMounted(async () => {
	// allOptions.value = await getAllActivityFormSelectOptions(props.selectOptionsSource);
	allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(props.selectOptionsSource);
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value);
});
// const filteredOptions = useActivitySelectOptionsFiltered(allOptions, formData);

watch(()=> formData.value,  async (newVal,oldVal) => {
	console.log(newVal)
	console.log(oldVal);
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, newVal);
}, {deep: true})

watch(() => formData.value.activityId, (newValue) => {
	emit('activityIdChanged', newValue);

});
watch(() => props.activityId, (newValue) => {
	formData.value.activityId = newValue;
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
	if (formData.value.activityId != null) {
		return true;
	} else {
		showErrorSnackbar(`Please select an activity`);
		return false;
	}
}

function saveActivityToHistory(startTimestamp: Date, activityLength: TimeLengthObject) {
	if (!formData.value.activityId) {
		showErrorSnackbar(`Please select an activity`);
	} else {
		addActivityToHistory(startTimestamp, activityLength, formData.value.activityId).then(isSuccess => {
			if (isSuccess) {
				showSnackbar(`Added record of activity ${getSelectedActivityName} to history`, {color: 'success'});
			} else {
				showErrorSnackbar(`Error saving record of activity ${getSelectedActivityName} to history`);
			}
		})
	}
}

function createNewActivity() {
	router.push({name: 'createNewActivity'});
}

const getSelectedActivityName = computed(() => {
	return filteredOptions.value?.activityOptions.find((item) => item.id === formData.value.activityId)?.text;
});
const getSelectedActivityId = computed(() => {
	return formData.value.activityId;
});

function setSelectedActivityId(activityId: number) {
	console.log(activityId)
	formData.value.activityId = activityId;
}

defineExpose({validate, setSelectedActivityId, getSelectedActivityName, getSelectedActivityId, saveActivityToHistory, formData});
const emit = defineEmits<{
	(e: "activityIdChanged", activityId: number | null): void;
}>()
</script>