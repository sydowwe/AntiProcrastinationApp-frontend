<template>
<div class="d-flex ga-3">
	<InputWithButton icon="plus" color="success" @create="addRoleDialog?.openAddDialog" density="compact">
		<VIdAutocomplete :label="$t('activities.role')" v-model="model.roleId" :items="roleOptions" hideDetails minWidth="250" density="compact"></VIdAutocomplete>
	</InputWithButton>
	<InputWithButton icon="plus" color="success" @create="addCategoryDialog?.openAddDialog" density="compact">
		<VIdAutocomplete
			:label="$t('activities.category')"
			v-model="model.categoryId"
			:items="categoryOptions" hideDetails minWidth="250" density="compact"
		></VIdAutocomplete>
	</InputWithButton>
	<ActivityRoleDialog ref="addRoleDialog" @created="onRoleCreated"></ActivityRoleDialog>
	<ActivityCategoryDialog ref="addCategoryDialog" @created="onCategoryCreated"></ActivityCategoryDialog>
</div>
</template>

<script setup lang="ts">
import ActivityCategoryDialog from '@/components/dialogs/activity/ActivityCategoryDialog.vue';
import InputWithButton from '@/components/general/InputWithButton.vue';
import ActivityRoleDialog from '@/components/dialogs/activity/ActivityRoleDialog.vue';
import {ref} from 'vue';
import {SelectOption} from '@/dtos/response/general/SelectOption.ts';
import {RoleRequest} from '@/dtos/request/activity/RoleRequest.ts';
import type {CategoryRequest} from '@/dtos/request/activity/CategoryRequest.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';

const {requiredRule} = useGeneralRules()
const addRoleDialog = ref<InstanceType<typeof ActivityRoleDialog>>();
const addCategoryDialog = ref<InstanceType<typeof ActivityCategoryDialog>>();

const roleOptions = ref<SelectOption[]>([]);
const categoryOptions = ref<SelectOption[]>([]);

const model = defineModel<{ roleId: number | null, categoryId: number | null }>({required: true});

function onRoleCreated(request: RoleRequest, createdId: number) {
	roleOptions.value.push(new SelectOption(createdId, request.name))
	model.value.roleId = createdId;
}

function onCategoryCreated(request: CategoryRequest, createdId: number) {
	categoryOptions.value.push(new SelectOption(createdId, request.name))
	model.value.categoryId = createdId;
}
</script>

<style scoped>

</style>