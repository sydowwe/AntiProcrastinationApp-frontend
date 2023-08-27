<template>
    <v-container fluid>
        <v-form ref="form" class="mt-5">
            <v-row justify="center">
                <v-col  :cols="12" :sm="10" :md="8" :lg="4">
                    <v-label>Role</v-label>
                    <v-autocomplete
                        v-if="!formData.isCustomRole"
                        v-model="formData.roleId"
                        :items="roleOptions"
                        item-title="name"
                        item-value="id"
                        density="comfortable"
                        clearable
                        variant="outlined"
                        :rules="roleIdRules"
                    ></v-autocomplete>
                    <v-text-field v-else v-model="formData.customRole" density="comfortable" clearable variant="outlined" :rules="customRoleRules"></v-text-field>
                    <v-checkbox label="Custom role" v-model="formData.isCustomRole" hide-details></v-checkbox>

                    <v-label>Category</v-label>
                    <v-autocomplete
                        v-if="!formData.isCustomCategory"
                        v-model="formData.categoryId"
                        :items="categoryOptions"
                        item-title="name"
                        item-value="id"
                        density="comfortable"
                        clearable
                        variant="outlined"
                        :rules="categoryIdRules"
                    ></v-autocomplete>
                    <v-text-field v-else v-model="formData.customCategory" density="comfortable" clearable variant="outlined" :rules="customCategoryRules"></v-text-field>
                    <v-checkbox label="Custom category" v-model="formData.isCustomCategory" hide-details></v-checkbox>

                    <v-label>Activity</v-label>
                    <v-text-field v-model="formData.activity" density="comfortable" clearable variant="outlined" :rules="activityRules"></v-text-field>
                    <v-row no-gutters>
                        <v-checkbox label="Is activity unavoidable" v-model="formData.isObligatoryActivity" density="comfortable" hide-details></v-checkbox>
                        <v-checkbox label="Place on to-do list" v-model="formData.isOnToDoList" density="comfortable" hide-details></v-checkbox>
                    </v-row>
                    <v-btn class="mt-3" width="200" color="primary" @click="validate()">Create</v-btn>
                </v-col>
            </v-row>
        </v-form>
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
    </v-container>
</template>
<script>
    export default {
        components: {},
        data() {
            return {
                showSnackbar: false,
                snackbarMessage: '',
                snackbarColor: '',
                formData: {
                    roleId: null,
                    customRole: '',
                    categoryId: null,
                    customCategory: '',
                    activity: '',
                    isCustomRole: false,
                    isCustomCategory: false,
                    isObligatoryActivity: false,
                    isOnToDoList: false,
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
            reset() {
                this.formData = {
                    roleId: null,
                    customRole: '',
                    categoryId: null,
                    customCategory: '',
                    name: '',
                    isCustomRole: false,
                    isCustomCategory: false,
                    isObligatoryActivity: false,
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
