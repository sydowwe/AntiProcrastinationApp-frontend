<template>
<v-dialog v-model="dialog" max-width="600" eager>
	<v-card class="px-6 py-4 text-center">
		<v-card-title class="pa-0">{{ isEdit ? $t('general.edit') : $t('general.add') + ' to to-do list' }}</v-card-title>
		<v-card-text class="px-0 pt-0">
			<VForm @keyup.native.enter="save">
				<VCheckbox class="mx-auto mb-3" v-model="isActivityFormHidden" :label="isEdit ? i18n.t('toDoList.quickEditToDoListActivity') : i18n.t('toDoList.quickCreateToDoListActivity')"
				           density="comfortable" hideDetails></VCheckbox>
				<ActivitySelectionForm v-show="!isActivityFormHidden" class="mb-4"
				                       :showFromToDoListField="false" :formDisabled="false" :isInDialog="true"
				                       :activityId="toDoListItem.activityId"
				                       @activityIdChanged="activityId => toDoListItem.activityId = activityId"></ActivitySelectionForm>
				<div v-show="isActivityFormHidden">
					<VTextField :label="$t('general.name')" v-model="quickActivityName"></VTextField>
					<VTextField :label="$t('general.text')" v-model="quickActivityText"></VTextField>
				</div>
				<VSelect
					:label="$t('toDoList.urgency')"
					v-model="toDoListItem.urgencyId"
					:clearable="false"
					hide-details
					item-title="text"
					item-value="id"
					:items="urgencyOptions"
				></VSelect>
			</VForm>
		</v-card-text>
		<v-card-actions class="justify-end px-0">
			<v-btn color="red" @click="dialog = false">{{ $t('general.cancel') }}</v-btn>
			<v-btn color="green" @click="save">{{ isEdit ? $t('general.edit') : $t('general.add') }}</v-btn>
		</v-card-actions>
	</v-card>
</v-dialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {UrgencyEntity} from '@/classes/UrgencyEntity';
import {ToDoListItemRequest, ToDoListItemEntity} from '@/classes/ToDoListItem';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {useQuickCreateActivity} from '@/compositions/quickCreateActivityComposition';
import {importDefaults} from '@/compositions/Defaults';

const {isActivityFormHidden, quickActivityName, quickActivityText, quickCreateActivity,quickEditActivity} = useQuickCreateActivity('To-do list task');
const {i18n, showErrorSnackbar} = importDefaults();
const dialog = ref(false);
const toDoListItem = ref(new ToDoListItemRequest());
const isEdit = ref(false);
const idToEdit = ref(0);
const urgencyOptions = ref([] as UrgencyEntity[]);

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
	toDoListItem.value.urgencyId = urgencyOptions.value.find((item) => item.priority === 1)?.id ?? null;
}

function getUrgencyOptions() {
	window.axios
		.post(`/urgency/get-all`)
		.then((response) => {
			urgencyOptions.value = UrgencyEntity.listFromObjects(response.data);
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
	'quickEditedActivity': [id: number,name: string, text: string | null]
}>();
defineExpose({
	openCreate,
	openEdit,
});
</script>
