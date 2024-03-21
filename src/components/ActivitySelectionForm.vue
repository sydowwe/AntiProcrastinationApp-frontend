<template>
<VRow class="justify-center" align="center" noGutters>
	<VCol v-if="showFromToDoListField" cols="auto" class="pb-0 pb-md-4">
		<VCheckbox label="From to-do list" v-model="isFromToDoList" :disabled="formDisabled" hide-details></VCheckbox>
	</VCol>
	<VCol v-if="showFromToDoListField" v-show="isFromToDoList" cols="12" md="5" lg="3" class="pt-1 pb-5 pb-md-4">
		<VSelect v-model="selectedUrgencyId" :items="selectOptions.taskUrgency" hide-details></VSelect>
	</VCol>
	<VCol cols="12" class="pt-1">
		<VRow>
			<VCol cols="12" :lg="isInDialog ? 12 : 6">
				<VAutocomplete label="Role" v-model="selectedRoleId" :items="selectOptions.role" :disabled="formDisabled"
				               hide-details></VAutocomplete>
			</VCol>
			<VCol cols="12" :lg="isInDialog ? 12 : 6">
				<VAutocomplete label="Category" v-model="selectedCategoryId" :items="selectOptions.category" :disabled="formDisabled"
				               hide-details></VAutocomplete>
			</VCol>
			<VCol cols="12">
				<VAutocomplete label="Activity" v-model="selectedActivityId" :items="selectOptions.activity" :disabled="formDisabled"
				               hide-details></VAutocomplete>
			</VCol>
		</VRow>
	</VCol>
	<VCol cols="auto" class="mt-4">
		<VBtn @click="createNewActivity()" color="primary">Vytvoriť novú aktivitu</VBtn>
	</VCol>
</VRow>
</template>

<script setup lang="ts">
//populate selects composition

import {reactive, ref, computed, watch} from 'vue';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {SelectOption} from '@/classes/SelectOption';
import {importDefaults} from '@/compositions/Defaults';
import {ActivitySelectOption} from '@/classes/Activity';
import {addActivityToHistory} from '@/compositions/SaveToHistoryComposition';

const {router, showErrorSnackbar, showSnackbar} = importDefaults();

const props = defineProps({
	formDisabled: {
		type: Boolean,
		required: true,
	},
	activityId: {
		type: Number,
		default: null,
	},
	showFromToDoListField: {
		type: Boolean,
		default: true,
	},
	isInDialog: {
		type: Boolean,
		default: false,
	}
});

const selectOptions = reactive({
	taskUrgency: [] as SelectOption[],
	role: [] as SelectOption[],
	category: [] as SelectOption[],
	activity: [] as ActivitySelectOption[],
});

const isFromToDoList = ref(false);
const selectedUrgencyId = ref(1);
const selectedRoleId = ref(null as number | null);
const selectedCategoryId = ref(null as number | null);
const selectedActivityId = ref(null as number | null);

populateSelects('taskUrgency', '/urgency/get-all');
populateSelects('role', '/role/get-all-options');
populateSelects('category', '/category/get-all-options');
populateSelects('activity', '/activity/get-all-options');


watch(selectedRoleId, () => {
	updateCategoriesAndActivities();
});
watch(selectedCategoryId, () => {
	updateRolesAndActivities();
});
watch(selectedActivityId, (newValue) => {
	emit('activityIdChanged',newValue);
	if (newValue) {
		const activity = selectOptions.activity.find((item) => item.id === newValue);
		console.log(activity)
		selectedRoleId.value = activity?.roleId ?? null;
		selectedCategoryId.value = activity?.categoryId ?? null;
	}
});
watch(() => props.activityId, (newValue) => {
	selectedActivityId.value = newValue;
});

function validate() {
	if(selectedActivityId.value != null){
		return true;
	}
	else {
		showErrorSnackbar(`Please select an activity`);
		return false;
	}
}

function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
	axios
		.post(url)
		.then((response) => {
			selectOptions[dataKey] = dataKey === 'activity' ? ActivitySelectOption.listFromObjects(response.data) : SelectOption.listFromObjects(response.data);
		})
		.catch((error) => {
			console.log(error);
		});
}

function updateRolesAndActivities() {
	selectedActivityId.value = null;
	if (selectedCategoryId.value) {
		populateSelects('role', `/role/get-options-by-category/${selectedCategoryId.value}`);
		updateActivitiesBy('category');
	} else {
		populateSelects('role', '/role/get-all-options');
		populateSelects('activity', '/activity/get-all-options');
	}
}

function updateCategoriesAndActivities() {
	selectedActivityId.value = null;
	if (selectedRoleId.value) {
		populateSelects('category', `/category/get-options-by-role/${selectedRoleId.value}`);
		updateActivitiesBy('role');
	} else {
		populateSelects('category', '/category/get-all-options');
		populateSelects('activity', '/activity/get-all-options');
	}
}

function updateActivitiesBy(byWhat: string) {
	selectedActivityId.value = null;
	if (selectedCategoryId.value || selectedRoleId.value) {
		populateSelects('activity', `/activity/get-options-by-${byWhat === 'category' ? 'category/' + selectedCategoryId.value : 'role/' + selectedRoleId.value}`);
	} else {
		selectOptions.activity = [];
	}
}

function saveActivityToHistory(startTimestamp: Date,activityLength: TimeLengthObject) {
	if(!selectedActivityId.value){
		showErrorSnackbar(`Please select an activity`);
	}
	else {
		addActivityToHistory(startTimestamp,activityLength,selectedActivityId.value).then(isSuccess=>{
			if (isSuccess) {
				showSnackbar(`Added record of activity ${getSelectedActivityName} to history`,{color:'success'});
			}else{
				showErrorSnackbar(`Error saving record of activity ${getSelectedActivityName} to history`);
			}
		})
	}
}

function createNewActivity() {
	router.push({name: 'createNewActivity'});
}
const getSelectedActivityName = computed(() => {
	return selectOptions.activity.find((item) => item.id === selectedActivityId.value)?.label;
});
const getSelectedActivityId = computed(() => {
	return selectedActivityId.value;
});

defineExpose({validate, getSelectedActivityName, getSelectedActivityId, saveActivityToHistory});
const emit = defineEmits<{
	(e: "activityIdChanged", activityId: number | null): void;
}>()
</script>