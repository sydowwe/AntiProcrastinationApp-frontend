<template>
<div class="flex-wrap d-flex justify-space-between">
	<VSwitch class="ml-2 mb-2 flex-wrap" color="primaryOutline" v-model="isActivityFormHidden"
	         :label='isEdit ? `Quick edit activity` :  `Quick create activity with role "${viewName}"`'
	         density="comfortable" hideDetails></VSwitch>

	<VSelect class="flex-1-0 mb-4 mt-2" v-if="isActivityFormHidden && isEdit" min-width="150" max-width="150" density="compact" label="Quick edit mode"
	         v-model="quickEditMode"
	         :items="['Overwrite', 'Clone']" hideDetails></VSelect>
</div>
<ActivitySelectionForm ref="activityForm"
                       v-if="!isActivityFormHidden"
                       v-model:activityId="selectedActivityId"
                       :showFromToDoListField="false"
                       :formDisabled="false"
                       :isFilter="false"
                       isInDialog
                       :selectOptionsSource="ActivityOptionsSource.ALL"
></ActivitySelectionForm>
<div v-else class="d-flex flex-column ga-4 pt-3">
	<VTextField :label="$t('general.name')+'*'" v-model="activityFormFieldData.name" required :rules="[requiredRule]"></VTextField>
	<VTextarea :label="$t('general.text')" v-model="activityFormFieldData.text" rows="2"></VTextarea>
	<VIdSelect class="mb-3" density="compact" :label="$t('activities.category')" v-model="activityFormFieldData.categoryId" :items="categoryOptions"
	           hide-details></VIdSelect>
</div>
</template>

<script setup lang="ts">
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {type QuickCreateActivityRoleName, useQuickCreateActivity} from '@/composables/quickCreateActivityComposition.ts';
import {ActivityOptionsSource} from '@/dtos/enum/ActivityOptionsSource.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import type {SelectOption} from '@/dtos/response/SelectOption.ts';
import {useActivitySelectOptions} from '@/composables/UseActivitySelectOptions.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {hasObjectChanged} from '@/scripts/helperMethods.ts';
import {QuickActivityToolsDto} from '@/dtos/response/QuickActivityToolsDto.ts';
import {useActivityCrud} from '@/composables/ConcretesCrudComposable.ts';

const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();
const {requiredRule} = useGeneralRules()
const {fetchCategorySelectOptions} = useActivitySelectOptions()
const {fetchById} = useActivityCrud()

const activityForm = ref<InstanceType<typeof ActivitySelectionForm>>();

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
				const cloneId = await quickEditActivity(activityBeforeEdit.value.id, quickEditMode.value)
				if (cloneId && quickEditMode.value === 'Clone') {
					return {activityId: cloneId, status: 'edit'};
				}
				return {activityId: activityBeforeEdit.value.id, status: 'edit'};
			}
			return {activityId: activityBeforeEdit.value.id, status: 'noChange'};
		} else {
			const newId = await quickCreateActivity()
			return {activityId: newId, status: 'create'};
		}
	}
	if (!await activityForm.value?.validate()) {
		showErrorSnackbar(`Please select an activity`);
		return;
	}
	return {activityId: selectedActivityId.value!, status: 'fromExisting'};
}

async function onOpenEdit(activityId: number) {
	const oldActivity = await fetchById(activityId)
	if (!oldActivity) {
		showErrorSnackbar(`Activity with id ${activityId} not found`);
		return;
	}
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