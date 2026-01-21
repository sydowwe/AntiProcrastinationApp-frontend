<template>
<MyDialog v-model="dialog" title="Create Activity" :isSmall="false" hasCloseBtn hasConfirmBtn confirmBtnLabel="Create" :confirmBtnDisabled="!isFormValid"
          @confirmed="validateAndSendForm" @closed="onClose">
	<VForm ref="form" class="d-flex flex-column ga-3" @submit.prevent="validateAndSendForm">
		<InputWithButton icon="plus" color="success" @create="addRoleDialog?.openAddDialog">
			<VIdAutocomplete :label="i18n.t('activities.role')" v-model="activityRequest.roleId" :items="roleOptions" required
			                 :rules="[requiredRule]"></VIdAutocomplete>
		</InputWithButton>
		<InputWithButton icon="plus" color="success" @create="addCategoryDialog?.openAddDialog">
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
		</VRow>
	</VForm>
</MyDialog>

<ActivityRoleDialog ref="addRoleDialog" @created="onRoleCreated"></ActivityRoleDialog>
<ActivityCategoryDialog ref="addCategoryDialog" @created="onCategoryCreated"></ActivityCategoryDialog>
</template>
<script setup lang="ts">
import {VForm} from 'vuetify/components';
import {ref, watch} from 'vue';
import {RoleRequest} from '@/dtos/request/RoleRequest';
import {SelectOption} from '@/dtos/response/SelectOption';
import {ActivityRequest} from '@/dtos/request/ActivityRequest';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useActivitySelectOptions} from '@/composables/UseActivitySelectOptions.ts';
import {useActivityCrud} from '@/composables/ConcretesCrudComposable.ts';
import ActivityRoleDialog from '@/components/dialogs/activity/ActivityRoleDialog.vue';
import ActivityCategoryDialog from '@/components/dialogs/activity/ActivityCategoryDialog.vue';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import InputWithButton from '@/components/general/InputWithButton.vue';
import type {CategoryRequest} from '@/dtos/request/CategoryRequest.ts';
import MyDialog from '@/components/dialogs/MyDialog.vue';

const {create} = useActivityCrud()
const {fetchRoleSelectOptions, fetchCategorySelectOptions} = useActivitySelectOptions()
const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();
const i18n = useI18n();

const form = ref<InstanceType<typeof VForm>>();
const addRoleDialog = ref<InstanceType<typeof ActivityRoleDialog>>();
const addCategoryDialog = ref<InstanceType<typeof ActivityCategoryDialog>>();

const {requiredRule} = useGeneralRules()

const dialog = ref(false);
const activityRequest = ref(new ActivityRequest());
const roleOptions = ref<SelectOption[]>([]);
const categoryOptions = ref<SelectOption[]>([]);
const isFormValid = ref(false);

const emit = defineEmits<{
	created: [request: ActivityRequest, createdId: number]
}>()

// Watch dialog open to fetch options
watch(dialog, async (isOpen) => {
	if (isOpen && roleOptions.value.length === 0) {
		roleOptions.value = await fetchRoleSelectOptions();
		categoryOptions.value = await fetchCategorySelectOptions();
	}
})

// Watch form validity
watch(activityRequest, async () => {
	if (form.value?.validate) {
		const {valid} = await form.value.validate();
		isFormValid.value = valid;
	}
}, {deep: true})

async function validateAndSendForm() {
	const {valid} = await form.value!.validate();
	if (valid) {
		const createdId = await create(activityRequest.value);
		if (createdId) {
			showSuccessSnackbar('Activity created successfully');
			emit('created', activityRequest.value, createdId);
			dialog.value = false;
			form.value!.reset();
			activityRequest.value = new ActivityRequest();
		}
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

function open() {
	dialog.value = true;
}

function onClose() {
	form.value!.reset();
	activityRequest.value = new ActivityRequest();
}

defineExpose({
	open
})
</script>
