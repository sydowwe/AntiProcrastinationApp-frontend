<template>
    <VContainer fluid>
        <VForm ref="form" class="mt-5">
            <VRow justify="center">
                <VCol :cols="12" :sm="10" :md="8" :lg="5" class="border btn pa-lg-10 pa-md-8 pa-sm-6 pa-5">
                    <v-label>Role</v-label>
                    <VRow no-gutters>
                        <v-autocomplete v-model="formData.roleId" :items="roleOptions" item-title="label" item-value="id" :rules="roleIdRules"></v-autocomplete>
                        <VBtn class="ml-2" icon="$plus" color="success" @click="addRoleDialog.open()"></VBtn>
                    </VRow>
                    <v-label>Category</v-label>
                    <VRow no-gutters>
                        <v-autocomplete v-model="formData.categoryId" :items="categoryOptions" item-title="label" item-value="id" :rules="categoryIdRules"></v-autocomplete>
                        <VBtn class="ml-2" icon="$plus" color="success" @click="addCategoryDialog.open()"></VBtn>
                    </VRow>
                    <v-label>Activity</v-label>
                    <VRow no-gutters>
                        <v-text-field v-model="formData.activity" :rules="activityRules"></v-text-field>
                        <VBtn class="ml-2" icon="$info" color="primary"></VBtn>
                    </VRow>
                    <v-textarea label="Activity description" v-model="formData.description"></v-textarea>
                    <VRow no-gutters>
                        <v-checkbox label="Is activity unavoidable" v-model="formData.isObligatory" hide-details></v-checkbox>
                        <v-checkbox label="Place on to-do list" v-model="formData.isOnToDoList" hide-details></v-checkbox>
                    </VRow>
                    <VRow justify="center" no-gutters>
                        <v-btn class="mt-3" width="200" color="success" @click="validate()">Create</v-btn>
                    </VRow>
                </VCol>
            </VRow>
        </VForm>
        <ContentDialog ref="addRoleDialog" title="Add new role" confirmBtnLabel="Create" @confirmed="createRole()">
            <v-text-field label="Name" v-model="newRole.name" :rules="customRoleRules"></v-text-field>
            <VTextarea label="Text" v-model="newRole.text" :rules="customRoleRules"></VTextarea>
            <VLabel>Color</VLabel>
            <VColorPicker label="Color" v-model="newRole.color" hide-inputs></VColorPicker>
        </ContentDialog>
        <ContentDialog ref="addCategoryDialog" title="Add new category" confirmBtnLabel="Create" @confirmed="createCategory()">
            <v-text-field label="Name" v-model="newCategory.name" :rules="customCategoryRules"></v-text-field>
            <VTextarea label="Text" v-model="newCategory.text" :rules="customCategoryRules"></VTextarea>
            <VLabel>Color</VLabel>
            <VColorPicker v-model="newCategory.color" hide-inputs></VColorPicker>
        </ContentDialog>
        <v-row justify="center">
            <v-dialog v-model="dialog" persistent max-width="512">
                <v-card>
                    <v-card-title>
                        <span class="text-h5">Confirm submission</span>
                    </v-card-title>
                    <v-card-text> Are u sure u want to create new activity - {{ formData.activity }} </v-card-text>
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
    </VContainer>
</template>
<script lang="ts">
    import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
    import ContentDialog from './dialogs/ContentDialog.vue';
    import { VuetifyFormType, DialogType } from '../classes/RefTypeInterfaces';
    import { defineComponent, ref } from 'vue';
    import { Role } from '../classes/DTOs/Role';
    import { Category } from '../classes/DTOs/Category';
    export default defineComponent({
        setup() {
            const form = ref<VuetifyFormType>({} as VuetifyFormType);
            const addCategoryDialog = ref<DialogType>({} as DialogType);
            const addRoleDialog = ref<DialogType>({} as DialogType);
            return { form, addCategoryDialog, addRoleDialog };
        },
        components: {
            ContentDialog,
            FontAwesomeIcon,
        },
        data() {
            return {
                showSnackbar: false,
                snackbarMessage: '',
                snackbarColor: '',
                formData: {
                    roleId: null as number | null,
                    categoryId: null as number | null,
                    activity: '',
                    description: '',
                    isObligatory: false,
                    isOnToDoList: false,
                },
                newRole: {} as Role,
                newCategory: {} as Category,
                roleOptions: [] as Role[],
                categoryOptions: [] as Category[],
                dialog: false,
                roleIdRules: [(v: number | null) => !!v || 'Role is required'],
                customRoleRules: [(v: string) => !!v || 'Custom role is required'],
                categoryIdRules: [(v: number | null) => !!v || 'Category is required'],
                customCategoryRules: [(v: string) => !!v || 'Custom category is required'],
                activityRules: [(v: string) => !!v || 'Activity is required'],
            };
        },
        created() {
            axios
                .post('/role/get-all')
                .then((response) => {
                    this.roleOptions = response.data as Role[];
                })
                .catch((error) => {
                    console.error(error);
                });
            axios
                .post('/category/get-all')
                .then((response) => {
                    this.categoryOptions = response.data as Category[];
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        methods: {
            reset() {
                this.formData = {
                    roleId: null,
                    categoryId: null,
                    activity: '',
                    description: '',
                    isObligatory: false,
                    isOnToDoList: false,
                };
            },
            async validate() {
                const { valid } = await this.form.validate();
                if (valid) {
                    this.dialog = true;
                } else {
                    this.showSnackbar = true;
                    this.snackbarMessage = 'Please fix the form errors.';
                    this.snackbarColor = 'error';
                }
            },
            createNewActivity() {
                axios
                    .post('/activity/create', this.formData)
                    .then((response) => {
                        this.reset();
                        this.showSnackbar = true;
                        this.snackbarMessage = 'Succesfully created new activity';
                        this.snackbarColor = 'success';
                        this.dialog = false;
                    })
                    .catch((error) => {
                        console.error('Form submission error', error);
                    });
            },
            createRole() {
                axios
                    .post('/role/create', this.newRole)
                    .then((response) => {
                        this.roleOptions.push(response.data as Role);
                        this.showSnackbar = true;
                        this.snackbarMessage = 'Succesfully created new role';
                        this.snackbarColor = 'success';
                    })
                    .catch((error) => {
                        console.error('Form submission error', error);
                    });
            },
            createCategory() {
                axios
                    .post('/category/create', this.newCategory)
                    .then((response) => {
                        this.categoryOptions.push(response.data as Category);
                        this.showSnackbar = true;
                        this.snackbarMessage = 'Succesfully created new category';
                        this.snackbarColor = 'success';
                    })
                    .catch((error) => {
                        console.error('Form submission error', error);
                    });
            },
        },
        watch: {
            'formData.roleId'(newValue) {
            },
            'formData.categoryId'(newValue) {
            },
        },
    });
</script>
<style scoped>
    .border {
        border: 2px solid #9b9b9b !important;
        border-radius: 1rem;
    }
</style>
