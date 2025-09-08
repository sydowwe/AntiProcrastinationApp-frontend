<template>
<MyDialog v-model="dialog" :title="isEdit ? $t('general.edit') : $t('general.add') + ' to routine to-do list'"
          :confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')"
          @confirmed="save" :eager="true"
>
	<VCheckbox class="mx-auto mt-3 mb-2" v-model="isActivityFormHidden" :label="i18n.t('routineTodoList.quickCreateRoutineToDoListActivity')"
	           density="comfortable" hideDetails></VCheckbox>
	<ActivitySelectionForm v-model="activityFormDto" v-if="!isActivityFormHidden" class="mb-4"
	                       :showFromToDoListField="false" :formDisabled="false" :isInDialog="true"
	                       :activityId="routineToDoListItem.activityId"
	                       :selectOptionsSource="ActivityOptionsSource.ALL"
	                       @activityIdChanged="activityId => routineToDoListItem.activityId = activityId"></ActivitySelectionForm>
	<template v-else>
		<VTextField :label="$t('general.name')+'*'" v-model="quickActivityName"></VTextField>
		<VTextField :label="$t('general.text')" v-model="quickActivityText"></VTextField>
		<VIdSelect :label="$t('activity.category')" v-model="quickActivityCategoryId" :items="categoryOptions"></VIdSelect>
	</template>
	<div class="mb-4 w-100 d-flex flex-column flex-md-row ga-4 align-center">
		<VSwitch v-model="isRepeated" label="More than once" color="primary" hide-details></VSwitch>
		<VNumberInput v-if="isRepeated && isEdit" label="Done count" v-model="routineToDoListItem.doneCount" :min="0" :max="routineToDoListItem.totalCount ?? 1" :width="180" max-width="190" control-variant="split" hide-details></VNumberInput>
		<VNumberInput v-if="isRepeated" label="Total count" v-model="routineToDoListItem.totalCount" :min="2" :width="180" max-width="190" control-variant="split" hide-details></VNumberInput>
	</div>
	<VIdSelect class="py-2" :label="$t('toDoList.timePeriod')" v-model="routineToDoListItem.timePeriodId" :clearable="false" hide-details
	         :items="timePeriodOptions"></VIdSelect>
</MyDialog>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {RoutineTodoListItemRequest, RoutineTodoListItemEntity} from '@/classes/ToDoListItem';
import {useQuickCreateActivity} from '@/composables/quickCreateActivityComposition';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {useI18n} from 'vue-i18n';
import {ActivityFormRequest, ActivityOptionsSource} from '@/classes/ActivityFormHelper';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {SelectOption} from '@/classes/SelectOption';
import {EntityWithSelectOptions} from '@/composables/ActivitySelectsComposition';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useActivitySelectOptions} from '@/composables/UseActivitySelectOptions.ts';
import {useTaskPlanningSelectOptions} from '@/composables/TaskPlanningSelectOptions.ts';

const {isActivityFormHidden, quickActivityName, quickActivityText, quickActivityCategoryId, quickCreateActivity, quickEditActivity} = useQuickCreateActivity('Routine task');
const {fetchCategorySelectOptions} = useActivitySelectOptions()
const {fetchTimePeriodEntitySelectOptions} = useTaskPlanningSelectOptions()

const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();

const categoryOptions = ref<SelectOption[]>([]);

const activityFormDto = ref(new ActivityFormRequest())
const routineToDoListItem = ref(new RoutineTodoListItemRequest());

const dialog = ref(false);
const isEdit = ref(false);
const entityBeforeEdit = ref<RoutineTodoListItemEntity | null>(null);

const isRepeated = ref(false);
const timePeriodOptions = ref<SelectOption[]>([]);

const emit = defineEmits(['edit', 'add','quickEditedActivity']);

watch(dialog, (newValue) => {
	if (!newValue) {
		routineToDoListItem.value = new RoutineTodoListItemRequest();
		setDefaultTimePeriod();
	}
});

onMounted( async () => {
	categoryOptions.value = await fetchCategorySelectOptions();
	timePeriodOptions.value = await fetchTimePeriodEntitySelectOptions();
	setDefaultTimePeriod();
});

const setDefaultTimePeriod = () => {
	routineToDoListItem.value.timePeriodId = timePeriodOptions.value[0].id;
};

async function save() {
	if (isActivityFormHidden.value) {
		if (isEdit.value && routineToDoListItem.value.activityId) {
			if (entityBeforeEdit.value?.activity.name !== quickActivityName.value || entityBeforeEdit.value.activity.text !== quickActivityText.value) {
				if (await quickEditActivity(routineToDoListItem.value.activityId)) {
					emit('quickEditedActivity', entityBeforeEdit.value?.id ?? 0);
				}
			}
		} else {
			routineToDoListItem.value.activityId = await quickCreateActivity();
		}
	} else if (!routineToDoListItem.value.activityId) {
		showErrorSnackbar(i18n.t("planner.pleaseSelectActivity"));
		return;
	}else{
		routineToDoListItem.value.activityId = activityFormDto.value.activityId;
	}

	if (!isRepeated.value) {
		routineToDoListItem.value.totalCount = null;
		if (isEdit.value){
			routineToDoListItem.value.doneCount = null;
		}
	}
	if (isEdit.value) {
		emit('edit', entityBeforeEdit.value, routineToDoListItem.value);
	} else {
		emit('add', routineToDoListItem.value);
	}
	dialog.value = false;
}

const close = () => {
	dialog.value = false;
};
const openCreate = () => {
	isEdit.value = false;
	dialog.value = true;
};
const openEdit = (entityToEdit: RoutineTodoListItemEntity) => {
	isEdit.value = true;
	entityBeforeEdit.value = entityToEdit;
	routineToDoListItem.value = RoutineTodoListItemRequest.fromEntity(entityToEdit);
	console.log(routineToDoListItem.value)
	dialog.value = true;
};


defineExpose({
	openCreate,
	openEdit,
	close,
});
</script>
