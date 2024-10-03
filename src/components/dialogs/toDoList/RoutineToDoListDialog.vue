<template>
<MyDialog v-model="dialog" :title="isEdit ? $t('general.edit') : $t('general.add') + ' to routine to-do list'"
          :confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')"
          @confirmed="save" :eager="true"
>
	<VCheckbox class="mx-auto mt-3 mb-2" v-model="isActivityFormHidden" :label="i18n.t('toDoList.quickCreateRoutineToDoListActivity')"
	           density="comfortable" hideDetails></VCheckbox>
	<ActivitySelectionForm ref="activitySelectionForm" v-if="!isActivityFormHidden" class="mb-4"
	                       :showFromToDoListField="false" :formDisabled="false" :isInDialog="true"
	                       :activityId="routineToDoListItem.activityId"
	                       :selectOptionsSource="ActivityOptionsSource.ALL"
	                       @activityIdChanged="activityId => routineToDoListItem.activityId = activityId"></ActivitySelectionForm>
	<template v-else>
		<VTextField :label="$t('general.name')" v-model="quickActivityName"></VTextField>
		<VTextField :label="$t('general.text')" v-model="quickActivityText"></VTextField>
	</template>
	<VSelect :label="$t('toDoList.timePeriod')" v-model="routineToDoListItem.timePeriodId" :clearable="false" hide-details
	         item-title="text" item-value="id" :items="timePeriodOptions"></VSelect>
</MyDialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {RoutineToDoListItemRequest, RoutineToDoListItemEntity, TimePeriodEntity} from '@/classes/ToDoListItem';
import {useQuickCreateActivity} from '@/compositions/quickCreateActivityComposition';
import {importDefaults} from '@/compositions/Defaults';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {useI18n} from 'vue-i18n';
import {ActivityOptionsSource} from '@/classes/ActivityFormHelper';
import MyDialog from '@/components/dialogs/MyDialog.vue';

const {isActivityFormHidden, quickActivityName, quickActivityText, quickCreateActivity} = useQuickCreateActivity('Routine task');

const i18n = useI18n();
const {showErrorSnackbar} = importDefaults();
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
		.post(`/routine-time-period/get-all`)
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
