<template>
<VRow class="justify-center" align="center" noGutters>
	<VCol v-if="showFromToDoListField" cols="auto" class="pb-0 pb-md-4">
		<VCheckbox label="From to-do list" v-model="formData.isFromToDoList" :disabled="formDisabled" hide-details></VCheckbox>
	</VCol>
	<VCol v-if="showFromToDoListField" v-show="formData.isFromToDoList" cols="12" md="5" lg="3" class="pt-1 pb-5 pb-md-4">
		<!--		<VSelect v-model="selectedUrgencyId" :items="selectOptions.taskUrgency" hide-details></VSelect>-->
	</VCol>
	<VCol cols="12" class="pt-1">
		<VRow>
			<VCol cols="12" :lg="isInDialog ? 12 : 6">
				<VAutocomplete label="Role" v-model="formData.roleId" :items="selectOptions.role" :disabled="formDisabled"
				               hide-details></VAutocomplete>
			</VCol>
			<VCol cols="12" :lg="isInDialog ? 12 : 6">
				<VAutocomplete label="Category" v-model="formData.categoryId" :items="selectOptions.category" :disabled="formDisabled"
				               hide-details></VAutocomplete>
			</VCol>
			<VCol cols="12">
				<VAutocomplete label="Activity" v-model="formData.activityId" :items="selectOptions.activity" :disabled="formDisabled"
				               hide-details></VAutocomplete>
			</VCol>
		</VRow>
		<TriStateCheckbox v-model="tristate" label="test"></TriStateCheckbox>
	</VCol>
	<VCol cols="auto" class="mt-4">
		<VBtn @click="createNewActivity()" color="primary">Vytvoriť novú aktivitu</VBtn>
	</VCol>
</VRow>
</template>

<script setup lang="ts">

import {reactive, ref, computed, watch} from 'vue';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {importDefaults} from '@/compositions/Defaults';
import {addActivityToHistory} from '@/compositions/SaveToHistoryComposition';
import {ActivityOptionsSource} from '@/classes/AcitivityOptionsSource';
import {ActivityFormSelects, ActivityFormRequest} from '@/classes/Activity';
import TriStateCheckbox from '@/components/TriStateCheckbox.vue';

const {router, showErrorSnackbar, showSnackbar} = importDefaults();

const tristate = ref('');

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
	},
	selectOptionsSource: {
		type: Number,
		default: ActivityOptionsSource.ALL
	}
});


const selectOptions = ref(new ActivityFormSelects());
const formData = reactive(new ActivityFormRequest());

updateFilterSelects();

function updateFilterSelects() {
	let url = 'activity';
	switch (props.selectOptionsSource) {
		case ActivityOptionsSource.HISTORY:
			url = 'history';
			break;
		default:
			break;
	}
	axios
		.post(url + '/update-filter-selects', formData)
		.then((response) => {
			console.log(response.data);
			selectOptions.value = ActivityFormSelects.fromObject(response.data);
		})
		.catch((error) => {
			console.log(error);
		});
}

watch(() => formData.roleId, () => {
	updateFilterSelects();
});
watch(() => formData.categoryId, () => {
	updateFilterSelects();
});
watch(() => formData.activityId, (newValue) => {
	emit('activityIdChanged', newValue);
	updateFilterSelects();
});
watch(() => props.activityId, (newValue) => {
	formData.activityId = newValue;
});

function validate() {
	if (formData.activityId != null) {
		return true;
	} else {
		showErrorSnackbar(`Please select an activity`);
		return false;
	}
}

function saveActivityToHistory(startTimestamp: Date, activityLength: TimeLengthObject) {
	if (!formData.activityId) {
		showErrorSnackbar(`Please select an activity`);
	} else {
		addActivityToHistory(startTimestamp, activityLength, formData.activityId).then(isSuccess => {
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
	return selectOptions.value.activity?.find((item) => item.id === formData.activityId)?.label;
});
const getSelectedActivityId = computed(() => {
	return formData.activityId;
});

function setSelectedActivityId(activityId: number) {
	console.log(activityId)
	formData.activityId = activityId;
}

defineExpose({validate, setSelectedActivityId, getSelectedActivityName, getSelectedActivityId, saveActivityToHistory});
const emit = defineEmits<{
	(e: "activityIdChanged", activityId: number | null): void;
}>()
</script>