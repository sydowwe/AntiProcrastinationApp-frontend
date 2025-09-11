<template>
<MyDialog v-model="dialog" :title="isEdit ? $t('general.edit') : $t('general.add') + ' to routine to-do list'"
          :confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')"
          @confirmed="save" :eager="true" @closed="close"
>
	<VForm ref="form" @keyup.native.enter="save" @submit="save" validate-on="submit">
		<ActivitySelectOrQuickEditFormField ref="activityFormField" view-name="Routine task" :isEdit :old-activity-id="entityBeforeEdit?.activity.id"
		                                    :old-activity-name="entityBeforeEdit?.activity.name" :old-activity-text="entityBeforeEdit?.activity.name"
		 :old-activity-category-id="entityBeforeEdit?.activity.category?.id"></ActivitySelectOrQuickEditFormField>

		<TodoListRepeatCountFormField class="my-5" v-model="isRepeated" v-model:done-count="routineToDoListItem.doneCount" v-model:total-count="routineToDoListItem.totalCount" :isEdit></TodoListRepeatCountFormField>
		<VIdSelect class="pt-2 pb-3" :label="$t('toDoList.timePeriod')" v-model="routineToDoListItem.timePeriodId" :clearable="false"
		           :items="timePeriodOptions" hide-details></VIdSelect>
	</VForm>
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
import {VForm} from 'vuetify/components';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import TodoListRepeatCountFormField from '@/components/dialogs/toDoList/TodoListRepeatCountFormField.vue';


const {fetchTimePeriodEntitySelectOptions} = useTaskPlanningSelectOptions()

const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();
const form = ref<InstanceType<typeof VForm>>();

const routineToDoListItem = ref(new RoutineTodoListItemRequest());

const dialog = ref(false);
const isEdit = ref(false);
const entityBeforeEdit = ref<RoutineTodoListItemEntity | null>(null);

const isRepeated = ref(false);
const timePeriodOptions = ref<SelectOption[]>([]);

const emit = defineEmits(['edit', 'add', 'quickEditedActivity']);

watch(dialog, (newValue) => {
	if (!newValue) {
		routineToDoListItem.value = new RoutineTodoListItemRequest();
		setDefaultTimePeriod();
	}
});

onMounted(async () => {
	timePeriodOptions.value = await fetchTimePeriodEntitySelectOptions();
	setDefaultTimePeriod();
});

const setDefaultTimePeriod = () => {
	routineToDoListItem.value.timePeriodId = timePeriodOptions.value[0].id;
};

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid) {
		return;
	}

	const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus();
	if (activityFormFieldResult){
		routineToDoListItem.value.activityId = activityFormFieldResult.activityId
	}
	if (!isRepeated.value) {
		routineToDoListItem.value.totalCount = null;
		if (isEdit.value) {
			routineToDoListItem.value.doneCount = null;
		}
	}
	if (isEdit.value) {
		emit('edit', entityBeforeEdit.value, routineToDoListItem.value);
	} else {
		emit('add', routineToDoListItem.value);
	}
	close();
}

const close = () => {
	dialog.value = false;

	activityFormField.value?.reset();
	routineToDoListItem.value = new RoutineTodoListItemRequest();
	setDefaultTimePeriod();
	entityBeforeEdit.value = null;
};

const openCreate = () => {
	isEdit.value = false;
	dialog.value = true;
};

const openEdit = (entityToEdit: RoutineTodoListItemEntity) => {
	isEdit.value = true;
	entityBeforeEdit.value = entityToEdit;

	activityFormField.value?.onOpenEdit(entityBeforeEdit.value.activity);
	routineToDoListItem.value = RoutineTodoListItemRequest.fromEntity(entityToEdit);
	dialog.value = true;
};


defineExpose({
	openCreate,
	openEdit,
	close,
});
</script>
