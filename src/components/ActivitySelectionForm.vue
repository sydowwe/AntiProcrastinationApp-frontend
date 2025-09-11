<template>
<div class="d-flex flex-column">
	<div class="d-flex flex-column flex-md-row ga-3">
		<div v-if="showFromToDoListField" class="flex-1-1 d-flex flex-column flex-md-row ga-3">
			<NullFalseTrueCheckbox label="From to-do list" v-model="formData.isFromToDoList"
			                       :disabled="formDisabled" hide-details></NullFalseTrueCheckbox>
			<VIdSelect v-if="formData.isFromToDoList" class="flex-1-1" v-model="formData.taskUrgencyId"  :items="filteredOptions.taskUrgencyOptions" hide-details></VIdSelect>

		</div>
		<div v-if="showFromToDoListField" class="flex-1-1 d-flex flex-column flex-md-row ga-3">
			<NullFalseTrueCheckbox label="From routine to-do list" v-model="formData.isFromRoutineToDoList"
			                       :disabled="formDisabled" hide-details></NullFalseTrueCheckbox>
			<VIdSelect v-if="formData.isFromRoutineToDoList" class="flex-1-1" v-model="formData.routineTimePeriodId" :items="filteredOptions.routineTimePeriodOptions" hide-details></VIdSelect>
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
				<VIdAutocomplete label="*Activity" v-model="selectedActivityId" :items="filteredOptions.activityOptions"
				                 :disabled="formDisabled"
				                 required :rules="[requiredRule]" class="pb-1"></VIdAutocomplete>
			</InputWithButton>
		</VCol>
	</VRow>
</div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted, type PropType} from 'vue';
import {TimeLengthObject} from '@/classes/TimeUtils';
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

const formData = ref(new ActivityFormRequest());
const selectedActivityId = defineModel<number | undefined>({required: false, default: undefined});

onMounted(async () => {
	allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(props.selectOptionsSource);
	formData.value.activityId = selectedActivityId.value ?? undefined;
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value);
});

watch(() => formData.value, async (newVal) => {
	newVal.activityId = selectedActivityId.value ?? undefined;
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, newVal);
}, {deep: true})

watch(() => selectedActivityId.value, (newValue) => {
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
	if (selectedActivityId.value != null) {
		return true;
	} else {
		showErrorSnackbar(`Please select an activity`);
		return false;
	}
}

async function saveActivityToHistory(startTimestamp: Date, activityLength: TimeLengthObject) {
	if (!selectedActivityId.value) {
		showErrorSnackbar(`Please select an activity`);
	} else {
		const newId = await create(startTimestamp, activityLength, selectedActivityId.value);

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

const getSelectedActivityName = computed(() => {
	return filteredOptions.value?.activityOptions.find((item) => item.id === selectedActivityId.value)?.text;
});
const getSelectedActivityId = computed(() => {
	return selectedActivityId.value;
});

defineExpose({validate, getSelectedActivityName, getSelectedActivityId, saveActivityToHistory});
const emit = defineEmits<{
	(e: "activityIdChanged", activityId: number | undefined): void;
}>()
</script>