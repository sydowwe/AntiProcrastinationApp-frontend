<template>
    <VForm ref="form" class="mt-5">
        <VRow justify="center" no-gutters>
            <VCol :cols="12" :sm="10" :md="8" :lg="5" class="border btn pa-lg-8 pa-md-8 pa-sm-6 pa-5">
                <VLabel>{{ $t('activities.role') }}</VLabel>
                <VRow no-gutters>
                    <v-autocomplete v-model="activityRequest.roleId" :items="selectOptions.role" item-title="label" item-value="id" :rules="roleIdRules"></v-autocomplete>
                    <VBtn class="ml-2" icon="$plus" color="success" @click="addRoleDialog.open()"></VBtn>
                </VRow>
                <VLabel>{{ $t('activities.category') }}</VLabel>
                <VRow no-gutters>
                    <v-autocomplete
                        v-model="activityRequest.categoryId"
                        :items="selectOptions.category"
                        item-title="label"
                        item-value="id"
                        :rules="categoryIdRules"
                    ></v-autocomplete>
                    <VBtn class="ml-2" icon="$plus" color="success" @click="addCategoryDialog.open()"></VBtn>
                </VRow>
                <VLabel>{{ $t('activities.activity') }}</VLabel>
                <VRow no-gutters>
                    <v-text-field v-model="activityRequest.name" :rules="activityRules"></v-text-field>
                    <VBtn class="ml-2" icon="$info" color="primary"></VBtn>
                </VRow>
                <v-textarea class="my-3" :label="$t('activities.activityDescription')" v-model="activityRequest.text" hide-details></v-textarea>
                <VRow no-gutters>
                    <v-checkbox :label="$t('activities.isActivityUnavoidable')" v-model="activityRequest.isUnavoidable" hide-details></v-checkbox>
                    <v-checkbox :label="$t('activities.placeOnToDoList')" v-model="activityRequest.isOnToDoList" hide-details></v-checkbox>
                </VRow>
                <VRow justify="center" no-gutters>
                    <v-btn class="mt-3" width="200" color="success" @click="validate()">Create</v-btn>
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
    <v-row justify="center">
        <v-dialog v-model="dialog" persistent max-width="512">
            <v-card>
                <v-card-title>
                    <span class="text-h5">Confirm submission</span>
                </v-card-title>
                <v-card-text> Are u sure u want to create new activity - {{ activityRequest.name }} </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue-darken-1" variant="outlined" @click="dialog = false">Close</v-btn>
                    <v-btn color="blue-darken-1" variant="elevated" @click="createNewActivity()">Create</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="2000" location="center center">
        {{ snackbarMessage }}
    </v-snackbar>
</template>
<script setup lang="ts">
//populate selects composition

    import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
    import ContentDialog from './dialogs/ContentDialog.vue';
    import { VuetifyFormType, DialogType } from '../classes/types/RefTypeInterfaces';
    import { ref, reactive } from 'vue';
    import { Role } from '../classes/Role';
    import { Category } from '../classes/Category';
    import { IdLabelOption } from '../classes/IdLabelOption';
    import { ActivityRequest } from '../classes/Activity';
    import { useActivitySelection } from '../compositions/ActivitySelectionComposition';

    const form = ref<VuetifyFormType>({} as VuetifyFormType);
    const addCategoryDialog = ref<DialogType>({} as DialogType);
    const addRoleDialog = ref<DialogType>({} as DialogType);

    const showSnackbar = ref(false);
    const snackbarMessage = ref('');
    const snackbarColor = ref('');
    const dialog = ref(false);
    const roleIdRules = [(v: number | null) => !!v || 'Role is required'];
    const customRoleRules = [(v: string) => !!v || 'Custom role is required'];
    const categoryIdRules = [(v: number | null) => !!v || 'Category is required'];
    const customCategoryRules = [(v: string) => !!v || 'Custom category is required'];
    const activityRules = [(v: string) => !!v || 'Activity is required'];

    const activityRequest = ref(new ActivityRequest());
    const selectOptions = reactive({
        role: [] as IdLabelOption[],
        category: [] as IdLabelOption[],
    });
    const newEntity = reactive({
        role: new Role(),
        category: new Category()
    })

    function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
        axios
            .post(url)
            .then((response) => {
                selectOptions[dataKey] = IdLabelOption.listFromObjects(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }
    populateSelects('role', '/role/get-all-options');
    populateSelects('category', '/category/get-all-options');

    function reset() {
        activityRequest.value = new ActivityRequest();
    }
    async function validate() {
        const { valid } = await form.value.validate();
        if (valid) {
            dialog.value = true;
        } else {
            showSnackbar.value = true;
            snackbarMessage.value = 'Please fix the form errors.';
            snackbarColor.value = 'error';
        }
    }
    function createNewActivity() {
        axios
            .post('/activity/create', activityRequest.value)
            .then((response) => {
                reset();
                showSnackbar.value = true;
                snackbarMessage.value = 'Succesfully created new activity';
                snackbarColor.value = 'success';
                dialog.value = false;
            })
            .catch((error) => {
                console.error('Form submission error', error);
            });
    }
    function createEntity(entityType: keyof typeof selectOptions) {
        axios
            .post(`/${entityType}/create`, entityType === 'role' ? newEntity.role : newEntity.category)
            .then((response) => {
                selectOptions[entityType].push(response.data as IdLabelOption);
                showSnackbar.value = true;
                snackbarMessage.value = 'Succesfully created new role';
                snackbarColor.value = 'success';
                newEntity[entityType] = entityType === 'role' ? new Role() : new Category();
            })
            .catch((error) => {
                console.error('Form submission error', error);
            });
    }  
</script>
<style scoped>
    .border {
        border: 2px solid #9b9b9b !important;
        border-radius: 1rem;
    }
</style>
