<template>
    <VForm ref="form" class="mt-5">
        <VRow justify="center" no-gutters>
            <VCol :cols="12" :sm="10" :md="8" :lg="5" class="border btn pa-lg-8 pa-md-8 pa-sm-6 pa-5">
                <VLabel>{{ i18n.t('activities.role') }}</VLabel>
                <VRow no-gutters>
                    <VAutocomplete v-model="activityRequest.roleId" :items="selectOptions.role" item-title="label" item-value="id" :rules="roleIdRules"></VAutocomplete>
                    <VBtn class="ml-2" icon="$plus" color="success" @click="addRoleDialog.open()"></VBtn>
                </VRow>
                <VLabel>{{ i18n.t('activities.category') }}</VLabel>
                <VRow no-gutters>
                    <VAutocomplete
                        v-model="activityRequest.categoryId"
                        :items="selectOptions.category"
                        item-title="label"
                        item-value="id"
                        :rules="categoryIdRules"
                    ></VAutocomplete>
                    <VBtn class="ml-2" icon="$plus" color="success" @click="addCategoryDialog.open()"></VBtn>
                </VRow>
                <VLabel>{{ i18n.t('activities.activity') }}</VLabel>
                <VRow no-gutters>
                    <VTextField v-model="activityRequest.name" :rules="activityRules"></VTextField>
                    <VBtn class="ml-2" icon="$info" color="primary"></VBtn>
                </VRow>
                <VTextarea class="my-3" :label="i18n.t('activities.activityDescription')" v-model="activityRequest.text" hide-details></VTextarea>
                <VRow no-gutters>
                    <VCheckbox :label="i18n.t('activities.isActivityUnavoidable')" v-model="activityRequest.isUnavoidable" hide-details></VCheckbox>
                    <VCheckbox :label="i18n.t('activities.placeOnToDoList')" v-model="activityRequest.isOnToDoList" hide-details></VCheckbox>
                </VRow>
                <VRow justify="center" no-gutters>
                    <VBtn class="mt-3" width="200" color="success" @click="validate()">Create</VBtn>
                </VRow>
            </VCol>
        </VRow>
    </VForm>
    <ContentDialog ref="addRoleDialog" title="Add new role" confirmBtnLabel="Create" @confirmed="createEntity('role')">
        <v-text-field label="Name" v-model="newEntity.role.name" :rules="customRoleRules"></v-text-field>
        <VTextarea label="Text" v-model="newEntity.role.text" :rules="customRoleRules"></VTextarea>
        <VLabel>Color</VLabel>
        <VColorPicker label="Color" v-model="newEntity.role.color" hide-inputs></VColorPicker>
    </ContentDialog>
    <ContentDialog ref="addCategoryDialog" title="Add newEntity. category" confirmBtnLabel="Create" @confirmed="createEntity('category')">
        <v-text-field label="Name" v-model="newEntity.category.name" :rules="customCategoryRules"></v-text-field>
        <VTextarea label="Text" v-model="newEntity.category.text" :rules="customCategoryRules"></VTextarea>
        <VLabel>Color</VLabel>
        <VColorPicker v-model="newEntity.category.color" hide-inputs></VColorPicker>
    </ContentDialog>
    <VRow justify="center">
        <v-dialog v-model="dialog" persistent max-width="512">
            <v-card>
                <v-card-title>
                    <span class="text-h5">Confirm submission</span>
                </v-card-title>
                <v-card-text> Are u sure u want to create new activity - {{ activityRequest.name }} </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <VBtn color="blue-darken-1" variant="outlined" @click="dialog = false">Close</VBtn>
                    <VBtn color="blue-darken-1" variant="elevated" @click="createNewActivity()">Create</VBtn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </VRow>
</template>
<script setup lang="ts">
    //populate selects composition

    import ContentDialog from '../components/dialogs/ContentDialog.vue';
    import { VuetifyFormType, DialogType } from '@/classes/types/RefTypeInterfaces';
    import { ref, reactive } from 'vue';
    import { Role } from '@/classes/Role';
    import { Category } from '@/classes/Category';
    import { SelectOption } from '@/classes/SelectOption';
    import { ActivityRequest } from '@/classes/Activity';
    import { importDefaults } from '@/compositions/Defaults';
    import {useI18n} from 'vue-i18n';
    const { showErrorSnackbar, showSnackbar } = importDefaults();
	const i18n = useI18n();

    const form = ref<VuetifyFormType>({} as VuetifyFormType);
    const addCategoryDialog = ref<DialogType>({} as DialogType);
    const addRoleDialog = ref<DialogType>({} as DialogType);

    const dialog = ref(false);
    const roleIdRules = [(v: number | null) => !!v || 'Role is required'];
    const customRoleRules = [(v: string) => !!v || 'Custom role is required'];
    const categoryIdRules = [(v: number | null) => !!v || 'Category is required'];
    const customCategoryRules = [(v: string) => !!v || 'Custom category is required'];
    const activityRules = [(v: string) => !!v || 'Activity is required'];

    const activityRequest = ref(new ActivityRequest());
    const selectOptions = reactive({
        role: [] as SelectOption[],
        category: [] as SelectOption[],
    });
    const newEntity = reactive({
        role: new Role(),
        category: new Category(),
    });

    function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
        axios
            .post(url)
            .then((response) => {
                selectOptions[dataKey] = SelectOption.listFromObjects(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }
    populateSelects('role', '/role/get-all-options');
    populateSelects('category', '/category/get-all-options');

    async function validate() {
        const { valid } = await form.value.validate();
        if (valid) {
            dialog.value = true;
        } else {
            showErrorSnackbar('Please fix the form errors');
        }
    }
    function createNewActivity() {
        axios.post('/activity/create', activityRequest.value).then(() => {
            form.value.reset();
            dialog.value = false;
            showSnackbar('Activity created succesfully', { color: 'success' });
        });
    }
    function createEntity(entityType: keyof typeof selectOptions) {
        axios.post(`/${entityType}/create`, entityType === 'role' ? newEntity.role : newEntity.category).then((response) => {
			const newOpt = response.data as SelectOption;
            selectOptions[entityType].push(newOpt);
            newEntity[entityType] = entityType === 'role' ? new Role() : new Category();
            showSnackbar(entityType + ' created succesfully', { color: 'success' });
	        const key : keyof typeof activityRequest.value = (entityType === "role" ? "roleId" : "categoryId");
	        activityRequest.value[key] = newOpt.id;
        });
    }
</script>
<style scoped>
    .border {
        border: 2px solid #9b9b9b !important;
        border-radius: 1rem;
    }
</style>