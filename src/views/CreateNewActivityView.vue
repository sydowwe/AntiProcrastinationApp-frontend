<template>
<VRow justify="center" no-gutters>
	<VCol :cols="12" :sm="10" :md="8" :lg="5" class="border btn pa-lg-8 pa-md-8 pa-sm-6 pa-5">
		<VForm ref="form" class="mt-5">
			<VLabel>{{ i18n.t('activities.role') }}</VLabel>
			<VRow no-gutters>
				<VIdAutocomplete v-model="activityRequest.roleId" :items="roleOptions"
				                 :rules="roleIdRules"></VIdAutocomplete>
				<VBtn class="ml-2" icon="$plus" color="success" @click="addRoleDialog = true"></VBtn>
			</VRow>
			<VLabel>{{ i18n.t('activities.category') }}</VLabel>
			<VRow no-gutters>
				<VIdAutocomplete
					v-model="activityRequest.categoryId"
					:items="categoryOptions"
					:rules="categoryIdRules"
				></VIdAutocomplete>
				<VBtn class="ml-2" icon="$plus" color="success" @click="addCategoryDialog = true"></VBtn>
			</VRow>
			<VLabel>{{ i18n.t('activities.activity') }}</VLabel>
			<VRow no-gutters>
				<VTextField v-model="activityRequest.name" :rules="activityRules"></VTextField>
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
<MyDialog v-model="addRoleDialog" title="Add new role" :confirmBtnLabel="$t('general.create')" @confirmed="createEntity('role')">
	<v-text-field label="Name" v-model="newEntity.role.name" :rules="customRoleRules"></v-text-field>
	<VTextarea label="Text" v-model="newEntity.role.text" :rules="customRoleRules"></VTextarea>
	<VLabel>Color</VLabel>
	<VColorPicker label="Color" v-model="newEntity.role.color" hide-inputs></VColorPicker>
</MyDialog>
<MyDialog v-model="addCategoryDialog" title="Add new category" :confirmBtnLabel="$t('general.create')"
          @confirmed="createEntity('category')">
	<v-text-field label="Name" v-model="newEntity.category.name" :rules="customCategoryRules"></v-text-field>
	<VTextarea label="Text" v-model="newEntity.category.text" :rules="customCategoryRules"></VTextarea>
	<VLabel>Color</VLabel>
	<VColorPicker v-model="newEntity.category.color" hide-inputs></VColorPicker>
</MyDialog>

</template>
<script setup lang="ts">

import {VuetifyFormType} from '@/classes/types/RefTypeInterfaces';
import {onMounted, reactive, ref} from 'vue';
import {Role, RoleRequest} from '@/classes/Role';
import {Category, CategoryRequest} from '@/classes/Category';
import {SelectOption} from '@/classes/SelectOption';
import {ActivityRequest} from '@/classes/Activity';
import {importDefaults} from '@/compositions/general/Defaults';
import {useI18n} from 'vue-i18n';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {
	EntityWithSelectOptions,
	getAllEntityOptions,
} from '@/compositions/ActivitySelectsComposition';


const {showErrorSnackbar, showSnackbar} = importDefaults();
const i18n = useI18n();

const form = ref<VuetifyFormType>({} as VuetifyFormType);
const addCategoryDialog = ref(false);
const addRoleDialog = ref(false);

const dialog = ref(false);
const roleIdRules = [(v: number | null) => !!v || 'Role is required'];
const customRoleRules = [(v: string) => !!v || 'Custom role is required'];
const categoryIdRules = [(v: number | null) => !!v || 'Category is required'];
const customCategoryRules = [(v: string) => !!v || 'Custom category is required'];
const activityRules = [(v: string) => !!v || 'Activity is required'];

const activityRequest = ref(new ActivityRequest());
const roleOptions = ref<SelectOption[]>([]);
const categoryOptions = ref<SelectOption[]>([]);
const urgencyOptions = ref<SelectOption[]>([]);

const newEntity = reactive({
	role: new RoleRequest(),
	category: new CategoryRequest(),
});

onMounted(async () => {
	roleOptions.value = await getAllEntityOptions(EntityWithSelectOptions.Role);
	categoryOptions.value = await getAllEntityOptions(EntityWithSelectOptions.Category);
	urgencyOptions.value = await getAllEntityOptions(EntityWithSelectOptions.TaskUrgency);
	activityRequest.value.toDoListUrgencyId = urgencyOptions.value[0].id;
})


async function validateAndSendForm() {
	const {valid} = await form.value.validate();
	if (valid) {
		createNewActivity()
	} else {
		showErrorSnackbar('Please fix the form errors');
	}
}

function createNewActivity() {
	axios.post('/activity/create', activityRequest.value).then(() => {
		form.value.reset();
		dialog.value = false;
		showSnackbar('Activity created succesfully', {color: 'success'});
	});
}

function createEntity(entityType: keyof typeof newEntity) {
	axios.post(`/${entityType}/create`, entityType === 'role' ? newEntity.role : newEntity.category).then((response) => {
		const newOpt = SelectOption.fromIdName(response.data);
		entityType === "role" ? roleOptions.value.push(newOpt) : categoryOptions.value.push(newOpt);
		newEntity[entityType] = entityType === 'role' ? new Role() : new Category();
		showSnackbar(entityType + ' created succesfully', {color: 'success'});
		const key: keyof typeof activityRequest.value = (entityType === "role" ? "roleId" : "categoryId");
		activityRequest.value[key] = newOpt.id;
		addRoleDialog.value = addCategoryDialog.value = false;
	});
}
</script>
<style scoped>
.border {
	border: 2px solid #9b9b9b !important;
	border-radius: 1rem;
}
</style>