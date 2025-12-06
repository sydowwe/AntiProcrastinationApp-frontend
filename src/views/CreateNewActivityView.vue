<template>
<VRow justify="center" no-gutters>
	<VCol :cols="12" :sm="10" :md="8" :lg="5" class="border btn pa-lg-8 pa-md-8 pa-sm-6 pa-5">
		<VForm ref="form" class="mt-5 d-flex flex-column ga-3">
			<InputWithButton icon="plus" color="success" @create="addRoleDialog.openAddDialog">
				<VIdAutocomplete :label="i18n.t('activities.role')" v-model="activityRequest.roleId" :items="roleOptions" required
				                 :rules="[requiredRule]"></VIdAutocomplete>
			</InputWithButton>
			<InputWithButton icon="plus" color="success" @create="addCategoryDialog.openAddDialog">
				<VIdAutocomplete
					:label="i18n.t('activities.category')"
					v-model="activityRequest.categoryId"
					:items="categoryOptions"
					required
					:rules="[requiredRule]"
				></VIdAutocomplete>
			</InputWithButton>
			<InputWithButton icon="info" color="secondaryOutline">
				<VTextField :label="i18n.t('activities.activity')" v-model="activityRequest.name" :rules="[requiredRule]" required></VTextField>
			</InputWithButton>
			<VTextarea :label="i18n.t('activities.activityDescription')" v-model="activityRequest.text"
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
				<VBtn class="mt-3" width="200" color="primary" @click="validateAndSendForm()">Create</VBtn>
			</VRow>
		</VForm>
	</VCol>
</VRow>

<ActivityRoleDialog ref="addRoleDialog" @created="onRoleCreated"></ActivityRoleDialog>
<ActivityCategoryDialog ref="addCategoryDialog" @created="onCategoryCreated"></ActivityCategoryDialog>
</template>
<script setup lang="ts">
import type {VuetifyFormType} from '@/types/RefTypeInterfaces';
import {onMounted, ref} from 'vue';
import {RoleRequest} from '@/dtos/request/RoleRequest';
import {SelectOption} from '@/dtos/response/SelectOption';
import {ActivityRequest} from '@/dtos/request/ActivityRequest';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useActivitySelectOptions} from '@/composables/UseActivitySelectOptions.ts';
import {useTaskPlanningSelectOptions} from '@/composables/TaskPlanningSelectOptions.ts';
import {useActivityCrud} from '@/composables/ConcretesCrudComposable.ts';
import ActivityRoleDialog from '@/components/dialogs/activity/ActivityRoleDialog.vue';
import ActivityCategoryDialog from '@/components/dialogs/activity/ActivityCategoryDialog.vue';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import InputWithButton from '@/components/general/InputWithButton.vue';
import type {CategoryRequest} from '@/dtos/request/CategoryRequest.ts';

const {create} = useActivityCrud()
const {fetchRoleSelectOptions, fetchCategorySelectOptions} = useActivitySelectOptions()
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
	activityRequest.value.toDoListUrgencyId = urgencyOptions.value[0]?.id ?? null;
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