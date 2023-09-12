<template>
    <VContainer fluid>
        <VForm ref="form" class="mt-5">
            <VRow justify="center">
                <VCol :cols="12" :sm="10" :md="8" :lg="5" class="border btn pa-lg-10 pa-md-8 pa-sm-6 pa-5">
                    <v-label>Role</v-label>
                    <VRow no-gutters>
                        <v-autocomplete
                            v-model="formData.roleId"
                            :items="roleOptions"
                            item-title="label"
                            item-value="id"
                            density="comfortable"
                            clearable
                            variant="outlined"
                            :rules="roleIdRules"
                        ></v-autocomplete>
                        <VBtn class="ml-2" icon="$plus" color="green" @click="toggleRoleDialog()"></VBtn>
                    </VRow>
                    <v-label>Category</v-label>
                    <VRow no-gutters>
                        <v-autocomplete
                            v-model="formData.categoryId"
                            :items="categoryOptions"
                            item-title="label"
                            item-value="id"
                            density="comfortable"
                            clearable
                            variant="outlined"
                            :rules="categoryIdRules"
                        ></v-autocomplete>
                        <VBtn class="ml-2" icon="$plus" color="green" @click="toggleCategoryDialog()"></VBtn>
                    </VRow>
                    <v-label>Activity</v-label>
                    <VRow no-gutters>
                        <v-text-field v-model="formData.activity" density="comfortable" clearable variant="outlined" :rules="activityRules"></v-text-field>
                        <VBtn class="ml-2" icon="$info" color="blue"></VBtn>
                    </VRow>
                    <v-textarea label="Activity description" variant="outlined" v-model="formData.description"></v-textarea>
                    <VRow no-gutters>
                        <v-checkbox label="Is activity unavoidable" v-model="formData.isObligatoryActivity" density="comfortable" hide-details></v-checkbox>
                        <v-checkbox label="Place on to-do list" v-model="formData.isOnToDoList" density="comfortable" hide-details></v-checkbox>
                    </VRow>
                    <VRow justify="center" no-gutters>
                        <v-btn class="mt-3" width="200" color="green" @click="validate()">Create</v-btn>
                    </VRow>
                </VCol>
            </VRow>
        </VForm>
        <ContentDialog ref="addRoleDialog" title="Add new role" confirmBtnLabel="Create" @confirmed="createRole()">
            <v-text-field label="Name" v-model="newRole.name" density="comfortable" clearable variant="outlined" :rules="customRoleRules"></v-text-field>
            <VTextarea label="Text" v-model="newRole.text" density="comfortable" clearable variant="outlined" :rules="customRoleRules"></VTextarea>
            <VLabel>Color</VLabel>
            <VColorPicker label="Color" v-model="newRole.color" hide-inputs></VColorPicker>
        </ContentDialog>
        <ContentDialog ref="addCategoryDialog" title="Add new category" confirmBtnLabel="Create" @confirmed="createCategory()">
            <v-text-field label="Name" v-model="newCategory.name" density="comfortable" clearable variant="outlined" :rules="customCategoryRules"></v-text-field>
            <VTextarea label="Text" v-model="newCategory.text" density="comfortable" clearable variant="outlined" :rules="customCategoryRules"></VTextarea>
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
        <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" location="center">
            {{ snackbarMessage }}
        </v-snackbar>
    </VContainer>
</template>
<script>
    import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
    import ContentDialog from './dialogs/ContentDialog.vue';
    export default {
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
                    roleId: null,
                    categoryId: null,
                    activity: '',
                    description: '',
                    isObligatory: false,
                    isOnToDoList: false,
                },
                newRole: {
                    name: null,
                    text: null,
                    color: null
                },
                newCategory: {
                    name: null,
                    text: null,
                    color: null
                },
                roleOptions: [],
                categoryOptions: [],
                dialog: false,
                roleIdRules: [(v) => !!v || 'Role is required'],
                customRoleRules: [(v) => !!v || 'Custom role is required'],
                categoryIdRules: [(v) => !!v || 'Category is required'],
                customCategoryRules: [(v) => !!v || 'Custom category is required'],
                activityRules: [(v) => !!v || 'Activity is required'],
            };
        },
        created() {
            axios
                .post('/role/get-all')
                .then((response) => {
                    this.roleOptions = response.data;
                    console.log(response);
                })
                .catch((error) => {
                    console.error(error);
                });
            axios
                .post('/category/get-all')
                .then((response) => {
                    this.categoryOptions = response.data;
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        methods: {
            toggleRoleDialog() {
                this.$refs.addRoleDialog.openDialog();
            },
            toggleCategoryDialog() {
                this.$refs.addCategoryDialog.openDialog();
            },
            reset() {
                this.formData = {
                    roleId: null,
                    customRole: '',
                    categoryId: null,
                    customCategory: '',
                    activity: '',
                    description: '',
                    isObligatory: false,
                    isOnToDoList: false,
                };
            },
            async validate() {
                const { valid } = await this.$refs.form.validate();
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
                        console.log(response);
                        this.showSnackbar = true;
                        this.snackbarMessage = 'Succesfully created new activity';
                        this.snackbarColor = 'success';
                    })
                    .catch((error) => {
                        console.error('Form submission error', error);
                    });
            },
            createRole() {
                axios
                    .post('/role/create', this.newRole)
                    .then((response) => {
                        console.log(response);
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
                        console.log(response);
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
                console.log(newValue);
            },
            'formData.categoryId'(newValue) {
                console.log(newValue);
            },
        },
    };
</script>
<style scoped>
    .border {
        border: 2px solid #9b9b9b !important;
        border-radius: 1rem;
    }
</style>
