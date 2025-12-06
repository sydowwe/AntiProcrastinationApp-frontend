<template>
<MyDialog v-model="dialog" @confirmed="save" :eager="true"
          :title="isEdit ? $t('general.edit') : $t('general.add') + ' to to-do list'"
          :confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')">
	<VForm ref="form" @keyup.native.enter="save" @submit="save" validate-on="submit">
		<ActivitySelectOrQuickEditFormField ref="activityFormField" view-name="To-do list task" :isEdit></ActivitySelectOrQuickEditFormField>
		<TodoListRepeatCountFormField class="my-5" v-model="isRepeated" v-model:done-count="toDoListItem.doneCount" v-model:total-count="toDoListItem.totalCount"
		                              :isEdit></TodoListRepeatCountFormField>
		<VIdSelect
			:label="$t('toDoList.priority')"
			v-model="toDoListItem.taskPriorityId"
			:clearable="false"
			:items="priorityOptions"
			required
			:rules="[requiredRule]"
		></VIdSelect>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {TodoListItemEntity} from '@/dtos/response/TodoListItemEntity.ts';
import {ToDoListItemRequest} from '@/dtos/request/ToDoListItemRequest.ts';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useTaskUrgencyCrud} from '@/composables/ConcretesCrudComposable.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {VForm} from 'vuetify/components';
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import TodoListRepeatCountFormField from '@/components/dialogs/toDoList/TodoListRepeatCountFormField.vue';

const {requiredRule} = useGeneralRules()
const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();
const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const {fetchAll} = useTaskUrgencyCrud()

const priorityOptions = ref([] as TaskPriority[]);

const dialog = ref(false);
const isEdit = ref(false);
const toDoListItem = ref(new ToDoListItemRequest());
const oldItem = ref<TodoListItemEntity | null>(null);

const isRepeated = ref(false);

watch(dialog, (newValue) => {
	if (!newValue) {
		toDoListItem.value = new ToDoListItemRequest();
		setDefaultUrgency();
	}
});

onMounted(async () => {
	priorityOptions.value = await fetchAll();
	setDefaultUrgency();
})

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid) {
		return;
	}

	const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus();
	if (activityFormFieldResult) {
		toDoListItem.value.activityId = activityFormFieldResult.activityId
	}

	if (!isRepeated.value) {
		toDoListItem.value.totalCount = null;
		if (isEdit.value) {
			toDoListItem.value.doneCount = null;
		}
	}

	if (isEdit.value) {
		emit('edit', oldItem.value?.id ?? 0, toDoListItem.value);
	} else {
		emit('add', toDoListItem.value);
	}
	close();
}

function setDefaultUrgency() {
	toDoListItem.value.taskPriorityId = priorityOptions.value.find((item) => item.priority === 1)?.id;
}

const close = () => {
	dialog.value = false;

	activityFormField.value?.reset();
	toDoListItem.value = new ToDoListItemRequest();
	setDefaultUrgency();
	isEdit.value = false;
	oldItem.value = null;
};
const openCreate = () => {
	isEdit.value = false;
	dialog.value = true;
};

const openEdit = (entityToEdit: TodoListItemEntity) => {
	isEdit.value = true;
	oldItem.value = entityToEdit;

	activityFormField.value?.onOpenEdit(entityToEdit.activity);
	toDoListItem.value = ToDoListItemRequest.fromEntity(entityToEdit);
	isRepeated.value = (entityToEdit.totalCount ?? 0) > 1;
	dialog.value = true;
};
const emit = defineEmits<{
	(e: 'add', toDoList: ToDoListItemRequest): void
	(e: 'edit', idToEdit: number, toDoListItem: ToDoListItemRequest): void
	(e: 'quickEditedActivity', id: number): void
	(e: 'changedUrgency', id: number, taskPriorityId?: number): void
}>();
defineExpose({
	openCreate,
	openEdit,
	close,
});
</script>
