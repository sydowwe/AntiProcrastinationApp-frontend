<template>
<MyDialog v-model="dialog" @confirmed="save" :eager="true"
          :title="isEdit ? $t('general.edit') : $t('general.add') + ' to to-do list'"
          :confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')">
	<VForm @keyup.native.enter="save">
		<VCheckbox class="mx-auto mb-3" v-model="isActivityFormHidden"
		           :label="isEdit ? i18n.t('toDoList.quickEditToDoListActivity') : i18n.t('toDoList.quickCreateToDoListActivity')"
		           density="comfortable" hideDetails></VCheckbox>
		<ActivitySelectionForm v-show="!isActivityFormHidden" class="mb-4"
		                       :showFromToDoListField="false" :formDisabled="false" :isInDialog="true"
		                       :activityId="toDoListItem.activityId"
		                       :selectOptionsSource="ActivityOptionsSource.ALL"
		                       @activityIdChanged="activityId => toDoListItem.activityId = activityId"></ActivitySelectionForm>
		<div v-show="isActivityFormHidden">
			<VTextField :label="$t('general.name')" v-model="quickActivityName"></VTextField>
			<VTextField :label="$t('general.text')" v-model="quickActivityText"></VTextField>
		</div>
		<VIdSelect
			:label="$t('toDoList.urgency')"
			v-model="toDoListItem.taskUrgencyId"
			:clearable="false"
			hide-details
			:items="urgencyOptions"
		></VIdSelect>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {TaskUrgencyEntity} from '@/classes/TaskUrgencyEntity';
import {ToDoListItemRequest, ToDoListItemEntity} from '@/classes/ToDoListItem';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {useQuickCreateActivity} from '@/compositions/quickCreateActivityComposition';
import {importDefaults} from '@/compositions/general/Defaults';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useI18n} from 'vue-i18n';
import {ActivityOptionsSource} from '@/classes/ActivityFormHelper';
import {SelectOption} from '@/classes/SelectOption';


const {
	isActivityFormHidden,
	quickActivityName,
	quickActivityText,
	quickCreateActivity,
	quickEditActivity
} = useQuickCreateActivity('To-do list task');

const i18n = useI18n();
const {showErrorSnackbar} = importDefaults();
const dialog = ref(false);
const toDoListItem = ref(new ToDoListItemRequest());
const isEdit = ref(false);
const idToEdit = ref(0);
const urgencyOptions = ref([] as TaskUrgencyEntity[]);

watch(dialog, (newValue) => {
	if (!newValue) {
		closeAndReset();
	}
});

getUrgencyOptions();

async function save() {
	if (isActivityFormHidden.value) {
		if (quickActivityName.value) {
			if (isEdit.value && toDoListItem.value.activityId) {
				if (await quickEditActivity(toDoListItem.value.activityId)) {
					emit('quickEditedActivity', idToEdit.value, quickActivityName.value, quickActivityText.value);
				}
			} else {
				toDoListItem.value.activityId = await quickCreateActivity();
			}
		} else {
			showErrorSnackbar(i18n.t("planner.pleaseEnterActivityName"));
			return;
		}
	} else if (!toDoListItem.value.activityId) {
		showErrorSnackbar(i18n.t("planner.pleaseSelectActivity"));
		return;
	}
	if (isEdit.value) {
		emit('edit', idToEdit.value, toDoListItem.value);
	} else {
		emit('add', toDoListItem.value);
	}
	dialog.value = false;
}

function setDefaultUrgency() {
	toDoListItem.value.taskUrgencyId = urgencyOptions.value.find((item) => item.priority === 1)?.id ?? null;
}

function getUrgencyOptions() {
	axios.post(`/task-urgency/get-all`)
		.then((response) => {
			urgencyOptions.value = TaskUrgencyEntity.listFromObjects(response.data);
			setDefaultUrgency();
		})
		.catch(() => {
		});
}

const closeAndReset = () => {
	toDoListItem.value = new ToDoListItemRequest();
	setDefaultUrgency();
	dialog.value = false;
};
const openCreate = () => {
	isEdit.value = false;
	isActivityFormHidden.value = false;
	dialog.value = true;
};
const openEdit = (entityToEdit: ToDoListItemEntity) => {
	isActivityFormHidden.value = true;
	isEdit.value = true;
	idToEdit.value = entityToEdit.id;
	quickActivityName.value = entityToEdit.activity.name;
	quickActivityText.value = entityToEdit.activity.text;
	toDoListItem.value = ToDoListItemRequest.fromEntity(entityToEdit);
	dialog.value = true;
};
const emit = defineEmits<{
	'add': [toDoList: ToDoListItemRequest];
	'edit': [idToEdit: number, plannerTask: ToDoListItemRequest];
	'quickEditedActivity': [id: number, name: string, text: string | null]
}>();
defineExpose({
	openCreate,
	openEdit,
});
</script>
