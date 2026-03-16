<template>
	<VForm ref="form" class="d-flex flex-column ga-3" @submit.prevent="validate">
		<InputWithButton icon="plus" color="success" @create="addRoleDialog?.openAddDialog">
			<VIdAutocomplete
				:label="$t('activities.role')"
				v-model="model.roleId"
				:items="roleOptions"
				required
				:rules="[requiredRule]"
			/>
		</InputWithButton>
		<InputWithButton icon="plus" color="success" @create="addCategoryDialog?.openAddDialog">
			<VIdAutocomplete
				:label="$t('activities.category')"
				v-model="model.categoryId"
				:items="categoryOptions"
			/>
		</InputWithButton>
		<InputWithButton icon="info" color="secondaryOutline">
			<VTextField :label="$t('activities.activity')" v-model="model.name" :rules="[requiredRule]" required/>
		</InputWithButton>
		<VTextarea :label="$t('activities.activityDescription')" v-model="model.text" hideDetails/>
		<VRow noGutters>
			<VCheckbox :label="$t('activities.isActivityUnavoidable')" v-model="model.isUnavoidable" hideDetails/>
		</VRow>
	</VForm>

	<ActivityRoleDialog ref="addRoleDialog" @created="onRoleCreated"/>
	<ActivityCategoryDialog ref="addCategoryDialog" @created="onCategoryCreated"/>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {VForm} from 'vuetify/components';
import ActivityRoleDialog from '@/components/dialogs/activity/ActivityRoleDialog.vue';
import ActivityCategoryDialog from '@/components/dialogs/activity/ActivityCategoryDialog.vue';
import InputWithButton from '@/components/general/InputWithButton.vue';
import {ActivityRequest} from '@/dtos/request/activity/ActivityRequest.ts';
import type {RoleRequest} from '@/dtos/request/activity/RoleRequest.ts';
import type {CategoryRequest} from '@/dtos/request/activity/CategoryRequest.ts';
import {SelectOption} from '@/dtos/response/general/SelectOption.ts';
import {useActivitySelectOptions} from '@/composables/UseActivitySelectOptions.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';

const model = defineModel<ActivityRequest>({required: true});

const {fetchRoleSelectOptions, fetchCategorySelectOptions} = useActivitySelectOptions();
const {requiredRule} = useGeneralRules();

const form = ref<InstanceType<typeof VForm>>();
const addRoleDialog = ref<InstanceType<typeof ActivityRoleDialog>>();
const addCategoryDialog = ref<InstanceType<typeof ActivityCategoryDialog>>();
const roleOptions = ref<SelectOption[]>([]);
const categoryOptions = ref<SelectOption[]>([]);

onMounted(async () => {
	roleOptions.value = await fetchRoleSelectOptions();
	categoryOptions.value = await fetchCategorySelectOptions();
});

async function validate() {
	return form.value!.validate();
}

function reset() {
	form.value?.reset();
}

function onRoleCreated(newRole: RoleRequest, createdId: number) {
	roleOptions.value.push(new SelectOption(createdId, newRole.name));
	model.value.roleId = createdId;
}

function onCategoryCreated(newCategory: CategoryRequest, createdId: number) {
	categoryOptions.value.push(new SelectOption(createdId, newCategory.name));
	model.value.categoryId = createdId;
}

defineExpose({validate, reset});
</script>
