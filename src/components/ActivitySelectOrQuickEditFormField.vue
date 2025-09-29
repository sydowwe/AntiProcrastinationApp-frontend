<template>
<div class="d-flex justify-space-between">
	<VSwitch color="primaryOutline" class="mb-4" v-model="isActivityFormHidden"
	         :label="i18n.t('routineTodoList.quickCreateRoutineToDoListActivity')"
	         density="comfortable" hideDetails></VSwitch>

	<VSelect v-if="isActivityFormHidden && isEdit" max-width="150" label="Quick edit mode" v-model="quickEditMode" :items="['Overwrite', 'Clone']"></VSelect>
</div>
<ActivitySelectionForm v-model:activityId="selectedActivityId" v-if="!isActivityFormHidden" class="mb-5"
                       :showFromToDoListField="false" :formDisabled="false" isInDialog
                       :selectOptionsSource="ActivityOptionsSource.ALL"></ActivitySelectionForm>
<template v-else>
	<VTextField class="py-2" :label="$t('general.name')+'*'" v-model="activityFormFieldData.name" required :rules="[requiredRule]"></VTextField>
	<VTextarea class="py-2" :label="$t('general.text')" v-model="activityFormFieldData.text" rows="2"></VTextarea>
	<VIdSelect class="py-2 pb-3" :label="$t('activities.category')" v-model="activityFormFieldData.categoryId" :items="categoryOptions" hide-details></VIdSelect>
</template>
</template>

<script setup lang="ts">
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {type QuickCreateActivityRoleName, useQuickCreateActivity} from '@/composables/quickCreateActivityComposition.ts';
import {ActivityOptionsSource} from '@/classes/ActivityFormHelper.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import type {SelectOption} from '@/classes/SelectOption.ts';
import {useActivitySelectOptions} from '@/composables/UseActivitySelectOptions.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {type Activity, QuickActivityToolsDto} from '@/classes/Activity.ts';
import {hasObjectChanged} from '@/scripts/helperMethods.ts';

const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();
const {requiredRule} = useGeneralRules()
const {fetchCategorySelectOptions} = useActivitySelectOptions()

const {viewName} = defineProps<{
	viewName: QuickCreateActivityRoleName,
}>();

const {
	activityFormFieldData,
	isActivityFormHidden,
	quickCreateActivity,
	quickEditActivity
} = useQuickCreateActivity(viewName);

const selectedActivityId = ref<number | undefined>(undefined);
const categoryOptions = ref<SelectOption[]>([]);

const isEdit = ref(false);
const activityBeforeEdit = ref<QuickActivityToolsDto | null>(null);
const quickEditMode = ref<'Overwrite' | 'Clone'>('Overwrite');

onMounted(async () => {
	categoryOptions.value = await fetchCategorySelectOptions();
});

async function execAndReturnStatus() {
	if (isActivityFormHidden.value) {
		if (isEdit && activityBeforeEdit.value?.id) {
			if (hasObjectChanged(activityBeforeEdit.value, activityFormFieldData.value)) {
				if (activityBeforeEdit.value.name === activityFormFieldData.value.name) {
					activityFormFieldData.value.name += ' - copy';
				}
				const cloneId = await quickEditActivity(activityBeforeEdit.value?.id, quickEditMode.value)
				if (cloneId && quickEditMode.value === 'Clone') {
					return {activityId: cloneId, status: 'edit'};
				}
				return {activityId:  activityBeforeEdit.value?.id, status: 'edit'};
			}
			return {activityId: activityBeforeEdit.value?.id, status: 'noChange'};
		} else {
			const newId = await quickCreateActivity()
			return {activityId: newId, status: 'create'};
		}
	}
	return {activityId: selectedActivityId.value, status: 'fromExisting'};
}

function onOpenEdit(oldActivity: Activity) {
	isEdit.value = true;
	isActivityFormHidden.value = true;

	quickEditMode.value = 'Overwrite';

	activityBeforeEdit.value = new QuickActivityToolsDto(oldActivity.id, oldActivity.name, oldActivity.text, oldActivity.category?.id ?? null)

	activityFormFieldData.value = JSON.parse(JSON.stringify(activityBeforeEdit.value));

	selectedActivityId.value = oldActivity.id;
}

function reset() {
	isActivityFormHidden.value = false;
	activityFormFieldData.value = QuickActivityToolsDto.createEmpty;

	selectedActivityId.value = undefined;
}

defineExpose({
	execAndReturnStatus, reset, onOpenEdit
})
</script>