<template>
<MyDialog v-model="dialog" @confirmed="save" :eager="true"
          :title="isEdit ? $t('general.edit') : $t('general.add') + ' to to-do list'"
          :confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')">
	<VForm ref="form" @keyup.native.enter="save">
		<VSwitch class="mx-auto mb-3" color="primary" v-model="isActivityFormHidden"
		         :label="isEdit ? i18n.t('toDoList.quickEditToDoListActivity') : i18n.t('toDoList.quickCreateToDoListActivity')"
		         density="comfortable" hideDetails></VSwitch>
		<ActivitySelectionForm v-model="activityFormDto" v-show="!isActivityFormHidden" class="mb-4"
		                       :showFromToDoListField="false" :formDisabled="false" :isInDialog="true"
		                       :activityId="toDoListItem.activityId"
		                       :selectOptionsSource="ActivityOptionsSource.ALL"></ActivitySelectionForm>
		<div v-show="isActivityFormHidden">
			<VTextField :label="$t('general.name')+'*'" v-model="quickActivityName"></VTextField>
			<VTextField :label="$t('general.text')" v-model="quickActivityText"></VTextField>
			<VIdSelect :label="$t('activities.category')" v-model="quickActivityCategoryId" :items="categoryOptions"></VIdSelect>
		</div>
		<div class="mb-4 w-100 d-flex flex-column flex-md-row ga-4 align-center">
			<VSwitch v-model="isRepeated" label="More than once" color="primary" density="comfortable" hide-details></VSwitch>
			<VNumberInput v-if="isRepeated && isEdit" label="Done count" v-model="toDoListItem.doneCount" :min="0" :max="toDoListItem.totalCount ?? 1" :width="180"
			              max-width="190" control-variant="split" required :rules="[requiredRule]"/>
			<VNumberInput v-if="isRepeated" label="Total count" v-model="toDoListItem.totalCount" :min="2" :width="180" max-width="190" control-variant="split"
			              required :rules="[requiredRule]"/>
		</div>
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
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {useQuickCreateActivity} from '@/composables/quickCreateActivityComposition';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useI18n} from 'vue-i18n';
import {ActivityFormRequest, ActivityOptionsSource} from '@/classes/ActivityFormHelper';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useTaskUrgencyCrud} from '@/composables/ConcretesCrudComposable.ts';
import {useActivitySelectOptions} from '@/composables/UseActivitySelectOptions.ts';
import type {SelectOption} from '@/classes/SelectOption.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {VForm} from 'vuetify/components';

const {requiredRule} = useGeneralRules()
const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();
const form = ref<InstanceType<typeof VForm>>();

const {fetchAll} = useTaskUrgencyCrud()
const {fetchCategorySelectOptions} = useActivitySelectOptions()
const {
	isActivityFormHidden,
	quickActivityName,
	quickActivityText,
	quickActivityCategoryId,
	quickCreateActivity,
	quickEditActivity
} = useQuickCreateActivity('To-do list task');

const categoryOptions = ref<SelectOption[]>([]);
const urgencyOptions = ref([] as TaskUrgencyEntity[]);

const dialog = ref(false);
const activityFormDto = ref(new ActivityFormRequest())
const toDoListItem = ref(new ToDoListItemRequest());
const isEdit = ref(false);
const oldItem = ref<TodoListItemEntity | null>(null);

const isRepeated = ref(false);

watch(dialog, (newValue) => {
	if (!newValue) {
		closeAndReset();
	}
});

onMounted(async () => {
	categoryOptions.value = await fetchCategorySelectOptions();
	urgencyOptions.value = await fetchAll();
})

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid) {
		return;
	}

	toDoListItem.value.activityId = activityFormDto.value.activityId;

	if (isActivityFormHidden.value) {
		if (quickActivityName.value) {
			if (isEdit.value && toDoListItem.value.activityId) {
				if (oldItem.value?.activity.name !== quickActivityName.value || oldItem.value.activity.text !== quickActivityText.value) {
					if (await quickEditActivity(toDoListItem.value.activityId)) {
						emit('quickEditedActivity', oldItem.value?.id ?? 0);
					}
				} else if (oldItem.value.taskUrgency.id !== toDoListItem.value.taskUrgencyId) {
					emit('changedUrgency', oldItem.value.id, toDoListItem.value.taskUrgencyId);
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
	dialog.value = false;
}

function setDefaultUrgency() {
	toDoListItem.value.taskUrgencyId = urgencyOptions.value.find((item) => item.priority === 1)?.id;
}

const closeAndReset = () => {
	activityFormDto.value = new ActivityFormRequest();
	isActivityFormHidden.value = true;
	isEdit.value = false;
	oldItem.value = null;
	quickActivityName.value = '';
	quickActivityText.value = '';
	toDoListItem.value = new ToDoListItemRequest();
	setDefaultUrgency();
	dialog.value = false;
};
const openCreate = () => {
	isEdit.value = false;
	isActivityFormHidden.value = false;
	dialog.value = true;
};
const openEdit = (entityToEdit: TodoListItemEntity) => {
	isActivityFormHidden.value = true;
	isEdit.value = true;
	oldItem.value = entityToEdit;
	quickActivityName.value = entityToEdit.activity.name;
	quickActivityText.value = entityToEdit.activity.text;
	quickActivityCategoryId.value = entityToEdit.activity.category?.id ?? null;
	setDefaultUrgency();
	toDoListItem.value = ToDoListItemRequest.fromEntity(entityToEdit);
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
});
</script>
