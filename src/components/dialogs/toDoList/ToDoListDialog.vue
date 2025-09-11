<template>
<MyDialog v-model="dialog" @confirmed="save" :eager="true"
          :title="isEdit ? $t('general.edit') : $t('general.add') + ' to to-do list'"
          :confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')">
	<VForm ref="form" @keyup.native.enter="save" @submit="save" validate-on="submit">
		<ActivitySelectOrQuickEditFormField ref="activityFormField" view-name="To-do list task" :isEdit></ActivitySelectOrQuickEditFormField>
		<TodoListRepeatCountFormField class="my-5" v-model="isRepeated" v-model:done-count="toDoListItem.doneCount" v-model:total-count="toDoListItem.totalCount" :isEdit></TodoListRepeatCountFormField>
		<VIdSelect
			:label="$t('toDoList.urgency')"
			v-model="toDoListItem.taskUrgencyId"
			:clearable="false"
			:items="urgencyOptions"
			required
			:rules="[requiredRule]"
		></VIdSelect>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {TaskUrgencyEntity} from '@/classes/TaskUrgencyEntity';
import {ToDoListItemRequest, TodoListItemEntity} from '@/classes/ToDoListItem';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useTaskUrgencyCrud} from '@/composables/ConcretesCrudComposable.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {VForm} from 'vuetify/components';
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import {ActivityFormRequest} from '@/classes/ActivityFormHelper.ts';
import TodoListRepeatCountFormField from '@/components/dialogs/toDoList/TodoListRepeatCountFormField.vue';

const {requiredRule} = useGeneralRules()
const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();
const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const {fetchAll} = useTaskUrgencyCrud()

const urgencyOptions = ref([] as TaskUrgencyEntity[]);

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
	urgencyOptions.value = await fetchAll();
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
	toDoListItem.value.taskUrgencyId = urgencyOptions.value.find((item) => item.priority === 1)?.id;
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
	(e: 'changedUrgency', id: number, taskUrgencyId?: number): void
}>();
defineExpose({
	openCreate,
	openEdit,
	close,
});
</script>
