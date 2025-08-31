<template>
<VRow justify="center" no-gutters>
	<VCol :cols="12" :sm="10" :md="8" :lg="5" class="border btn pa-lg-8 pa-md-8 pa-sm-6 pa-5">
		<VForm ref="form" class="mt-5">
			<VLabel>{{ i18n.t('activities.role') }}</VLabel>
			<VRow no-gutters>
				<VIdAutocomplete v-model="activityRequest.roleId" :items="roleOptions"
				                 :rules="[requiredRule]"></VIdAutocomplete>
				<VBtn class="ml-2" icon="$plus" color="success" @click="addRoleDialog.openAddDialog()"></VBtn>
			</VRow>
			<VLabel>{{ i18n.t('activities.category') }}</VLabel>
			<VRow no-gutters>
				<VIdAutocomplete
					v-model="activityRequest.categoryId"
					:items="categoryOptions"
					:rules="[requiredRule]"
				></VIdAutocomplete>
				<VBtn class="ml-2" icon="$plus" color="success" @click="addCategoryDialog.openAddDialog()"></VBtn>
			</VRow>
			<VLabel>{{ i18n.t('activities.activity') }}</VLabel>
			<VRow no-gutters>
				<VTextField v-model="activityRequest.name" :rules="[requiredRule]"></VTextField>
				<VBtn class="ml-2" icon="$info" color="primary"></VBtn>
			</VRow>
			<VTextarea class="my-3" :label="i18n.t('activities.activityDescription')" v-model="activityRequest.text"
			           hide-details></VTextarea>
			<VRow no-gutters>
				<VCheckbox :label="i18n.t('activities.isActivityUnavoidable')" v-model="activityRequest.isUnavoidable"
				           hide-details></VCheckbox>
				<VCheckbox :label="i18n.t('activities.placeOnToDoList')" v-model="activityRequest.isOnToDoList"
				           hide-details></VCheckbox>
				<VIdSelect
					v-if="activityRequest.isOnToDoList"
					class="ml-3"
					:label="$t('toDoList.urgency')"
					v-model="activityRequest.toDoListUrgencyId"
					:clearable="false"
					hide-details
					:items="urgencyOptions"
				></VIdSelect>
			</VRow>
			<VRow justify="center" no-gutters>
				<VBtn class="mt-3" width="200" color="success" @click="validateAndSendForm()">Create</VBtn>
			</VRow>
		</VForm>
	</VCol>
</VRow>

<ActivityRoleDialog ref="addRoleDialog" @created="onRoleCreated"></ActivityRoleDialog>
<ActivityCategoryDialog ref="addCategoryDialog" @created="onCategoryCreated"></ActivityCategoryDialog>
</template>
<script setup lang="ts">

import type {VuetifyFormType} from '@/classes/types/RefTypeInterfaces';
import {onMounted, reactive, ref} from 'vue';
import {Role, RoleRequest} from '@/classes/Role';
import {Category, CategoryRequest} from '@/classes/Category';
import {SelectOption} from '@/classes/SelectOption';
import {ActivityRequest} from '@/classes/Activity';
import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {activitySelectOptions} from '@/composables/ActivitySelectOptions.ts';
import {useTaskPlanningSelectOptions} from '@/composables/TaskPlanningSelectOptions.ts';
import {useActivityCrud} from '@/composables/general/ConcretesCrudComposable.ts';
import ActivityRoleDialog from '@/components/dialogs/activity/ActivityRoleDialog.vue';
import ActivityCategoryDialog from '@/components/dialogs/activity/ActivityCategoryDialog.vue';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';

const {create} = useActivityCrud()
const {fetchRoleSelectOptions, fetchCategorySelectOptions} = activitySelectOptions()
const {fetchTaskUrgencySelectOptions} = useTaskPlanningSelectOptions()
const {showErrorSnackbar, showSnackbar} = useSnackbar();
const i18n = useI18n();

const form = ref<VuetifyFormType>({} as VuetifyFormType);
const addRoleDialog = ref<InstanceType<typeof ActivityRoleDialog>>({} as InstanceType<typeof ActivityRoleDialog>);
const addCategoryDialog = ref<InstanceType<typeof ActivityCategoryDialog>>({} as InstanceType<typeof ActivityCategoryDialog>);

const {requiredRule} = useGeneralRules()

const activityRequest = ref(new ActivityRequest());
const roleOptions = ref<SelectOption[]>([]);
const categoryOptions = ref<SelectOption[]>([]);
const urgencyOptions = ref<SelectOption[]>([]);


onMounted(async () => {
	roleOptions.value = await fetchRoleSelectOptions();
	categoryOptions.value = await fetchCategorySelectOptions();
	urgencyOptions.value = await fetchTaskUrgencySelectOptions();
	activityRequest.value.toDoListUrgencyId = urgencyOptions.value[0]?.id;
})


async function validateAndSendForm() {
	const {valid} = await form.value.validate();
	if (valid) {
		await create(activityRequest.value);
		form.value.reset();
		showSnackbar('Activity created succesfully', {color: 'success'});
	} else {
		showErrorSnackbar('Please fix the form errors');
	}
}

function onRoleCreated(request: RoleRequest, createdId: number) {
	roleOptions.value.push(new SelectOption(createdId, request.name))
	activityRequest.value.roleId = createdId;
}

function onCategoryCreated(request: CategoryRequest, createdId: number) {
	categoryOptions.value.push(new SelectOption(createdId, request.name))
	activityRequest.value.categoryId = createdId;
}
</script>
<style scoped>
.border {
	border: 2px solid #9b9b9b !important;
	border-radius: 1rem;
}
</style>