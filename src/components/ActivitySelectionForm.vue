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
				<InputWithButton icon="plus" color="success" @create="createNewActivity">
					<VIdAutocomplete label="Activity" v-model="formData.activityId" :items="filteredOptions.activityOptions"
					                 :disabled="formDisabled"
					                 required
					                 :rules="[requiredRule]"></VIdAutocomplete>
				</InputWithButton>
			</VCol>
		</VRow>
	</VCol>
</VRow>
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
import ActivityCategoryDialog from '@/components/dialogs/activity/ActivityCategoryDialog.vue';
import ActivityRoleDialog from '@/components/dialogs/activity/ActivityRoleDialog.vue';


const {requiredRule} = useGeneralRules()

const {showErrorSnackbar, showSnackbar} = useSnackbar();
const {create} = useActivityHistoryCrud()

const addRoleDialog = ref<InstanceType<typeof ActivityRoleDialog>>();
const addCategoryDialog = ref<InstanceType<typeof ActivityCategoryDialog>>();
const props = defineProps({
	formDisabled: {
		type: Boolean,
		default: false,
	},
	activityId: {
		type: Number as PropType<number | undefined>,
		default: undefined,
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

const formData = defineModel<ActivityFormRequest>({required: true});

onMounted(async () => {
	// allOptions.value = await getAllActivityFormSelectOptions(props.selectOptionsSource);
	allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(props.selectOptionsSource);
	filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value);
});
// const filteredOptions = useActivitySelectOptionsFiltered(allOptions, formData);

watch(() => formData.value, async (newVal, oldVal) => {
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

async function saveActivityToHistory(startTimestamp: Date, activityLength: TimeLengthObject) {
	if (!formData.value.activityId) {
		showErrorSnackbar(`Please select an activity`);
	} else {
		const newId = await create(startTimestamp, activityLength, formData.value.activityId);

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
	return filteredOptions.value?.activityOptions.find((item) => item.id === formData.value.activityId)?.text;
});
const getSelectedActivityId = computed(() => {
	return formData.value.activityId;
});

defineExpose({validate, getSelectedActivityName, getSelectedActivityId, saveActivityToHistory});
const emit = defineEmits<{
	(e: "activityIdChanged", activityId?: number): void;
}>()
</script>