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
		<VTextField :label="$t('general.name')+'*'" v-model="quickActivityName"></VTextField>
		<VTextField :label="$t('general.text')" v-model="quickActivityText"></VTextField>
		<VIdSelect :label="$t('activity.category')" v-model="quickActivityCategoryId" :items="categoryOptions"></VIdSelect>
	</template>
	<VSelect :label="$t('toDoList.timePeriod')" v-model="routineToDoListItem.timePeriodId" :clearable="false" hide-details item-value="id"
	         item-title="text"
	         :items="timePeriodOptions"></VSelect>
</MyDialog>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {RoutineTodoListItemRequest, RoutineTodoListItemEntity} from '@/classes/ToDoListItem';
import {useQuickCreateActivity} from '@/composables/quickCreateActivityComposition';

import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {useI18n} from 'vue-i18n';
import {ActivityOptionsSource} from '@/classes/ActivityFormHelper';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {SelectOption} from '@/classes/SelectOption';
import {EntityWithSelectOptions} from '@/composables/ActivitySelectsComposition';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const {isActivityFormHidden, quickActivityName, quickActivityText, quickActivityCategoryId, quickCreateActivity} = useQuickCreateActivity('Routine task');

const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();
const routineToDoListItem = ref(new RoutineTodoListItemRequest());
const dialog = ref(false);
const isEdit = ref(false);
const idToEdit = ref(null as number | null);
const categoryOptions = ref<SelectOption[]>([]);
const timePeriodOptions = ref<SelectOption[]>([]);

const emit = defineEmits(['edit', 'add']);

watch(dialog, (newValue) => {
	if (!newValue) {
		routineToDoListItem.value = new RoutineTodoListItemRequest();
		setDefaultTimePeriod();
	}
});
onMounted( async () => {
	categoryOptions.value = await getAllEntityOptions(EntityWithSelectOptions.Category);
	timePeriodOptions.value = await getAllEntityOptions(EntityWithSelectOptions.TimePeriod);
	setDefaultTimePeriod();
});

const setDefaultTimePeriod = () => {
	routineToDoListItem.value.timePeriodId = timePeriodOptions.value[0].id;
};

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

const close = () => {
	dialog.value = false;
};
const openCreate = () => {
	isEdit.value = false;
	dialog.value = true;
};
const openEdit = (entityToEdit: RoutineTodoListItemEntity) => {
	isEdit.value = true;
	idToEdit.value = entityToEdit.id;
	routineToDoListItem.value = RoutineTodoListItemRequest.fromEntity(entityToEdit);
	dialog.value = true;
};


defineExpose({
	openCreate,
	openEdit,
	close,
});
</script>
