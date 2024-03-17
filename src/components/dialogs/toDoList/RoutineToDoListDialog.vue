<template>
<v-dialog v-model="dialog" max-width="600">
	<v-card class="px-6 py-4 text-center">
		<v-card-title class="pa-0">{{ isEdit ? $t('general.edit') : $t('general.add') + ' to to-do list' }}</v-card-title>
		<v-card-text class="px-0">
			<ActivitySelectionForm ref="activitySelectionForm" v-if="!isActivityFormHidden" class="mb-4"
			                       :showFromToDoListField="false" :formDisabled="false" :isInDialog="true"
			                       :activityId="routineToDoListItem.activityId"
			                       @activityIdChanged="activityId => routineToDoListItem.activityId = activityId"></ActivitySelectionForm>
			<template v-else>
				<VTextField :label="$t('general.name')" v-model="quickActivityName"></VTextField>
				<VTextField :label="$t('general.text')" v-model="quickActivityText"></VTextField>
			</template>
			<VSelect :label="$t('toDoList.timePeriod')" v-model="routineToDoListItem.timePeriodId" :clearable="false" hide-details
			         item-title="text" item-value="id" :items="timePeriodOptions"></VSelect>
		</v-card-text>
		<v-card-actions class="justify-end px-0">
			<v-btn color="red" @click="close">{{ $t('general.cancel') }}</v-btn>
			<v-btn color="green" @click="save">{{ isEdit ? $t('general.edit') : $t('general.add') }}</v-btn>
		</v-card-actions>
	</v-card>
</v-dialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {RoutineToDoListItemRequest, RoutineToDoListItemEntity, TimePeriodEntity} from '@/classes/ToDoListItem';
import {useQuickCreateActivity} from '@/compositions/quickCreateActivityComposition';
import {importDefaults} from '@/compositions/Defaults';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';

const {isActivityFormHidden, quickActivityName, quickActivityText, quickCreateActivity} = useQuickCreateActivity('RoutineToDoList');
const {i18n, showErrorSnackbar} = importDefaults();
const routineToDoListItem = ref(new RoutineToDoListItemRequest());
const dialog = ref(false);
const isEdit = ref(false);
const idToEdit = ref(null as number | null);
const timePeriodOptions = ref([] as TimePeriodEntity[]);

watch(dialog, (newValue) => {
	if (!newValue) {
		routineToDoListItem.value = new RoutineToDoListItemRequest();
		setDefaultTimePeriod();
	}
});
const emit = defineEmits(['edit', 'add']);
getTimePeriodOptions();

async function save() {
	if (isActivityFormHidden.value) {
		if (quickActivityName.value) {
			routineToDoListItem.value.activityId = await quickCreateActivity();
		} else {
			showErrorSnackbar(i18n.t("planner.pleaseEnterActivityName"));
			return;
		}
	} else if (!routineToDoListItem.value.activityId) {
		showErrorSnackbar(i18n.t("planner.pleaseSelectActivity"));
		return;
	}
	if (isEdit.value) {
		emit('edit', idToEdit.value, routineToDoListItem.value);
	} else {
		emit('add', routineToDoListItem.value);
	}
	dialog.value = false;
}

function setDefaultTimePeriod() {
	routineToDoListItem.value.timePeriodId = timePeriodOptions.value.find((item) => item.lengthInDays === 1)?.id ?? null;
}

function getTimePeriodOptions() {
	window.axios
		.post(`/routine-to-do-list-time-period/get-all`)
		.then((response) => {
			timePeriodOptions.value = TimePeriodEntity.listFromObjects(response.data);
			setDefaultTimePeriod();
		})
}

const close = () => {
	dialog.value = false;
};
const openCreate = () => {
	isEdit.value = false;
	dialog.value = true;
};
const openEdit = (entityToEdit: RoutineToDoListItemEntity) => {
	isEdit.value = true;
	idToEdit.value = entityToEdit.id;
	routineToDoListItem.value = RoutineToDoListItemRequest.fromEntity(entityToEdit);
	dialog.value = true;
};


defineExpose({
	openCreate,
	openEdit,
	close,
});
</script>
