<template>
    <v-container max-width="600" width="400">
        <div class="mb-2">
            <v-label>Role</v-label>
            <v-combobox v-if="!formData.isCustomRole" v-model="formData.roleId" :items="roleOptions" item-title="label" item-value="id" density="comfortable" clearable variant="outlined"></v-combobox>
            <v-text-field v-else v-model="formData.customRole" density="comfortable" clearable variant="outlined"></v-text-field>
            <v-checkbox label="Custom role" v-model="formData.isCustomRole"></v-checkbox>
        </div>       
        <div class="mb-2">
            <v-label>Category</v-label>
            <v-combobox v-if="!formData.isCustomCategory" v-model="formData.categoryId" :items="categoryOptions" item-title="label" item-value="id" density="comfortable" clearable variant="outlined"></v-combobox>
            <v-text-field v-else v-model="formData.customCategory" density="comfortable" clearable variant="outlined"></v-text-field>
            <v-checkbox label="Custom category" v-model="formData.isCustomCategory"></v-checkbox>
        </div>
        <div class="mb-2">
            <label for="activityInput">Activity</label>
            <v-text-field v-model="formData.activity" density="comfortable" clearable variant="outlined"></v-text-field>
        </div>
        <div class="mb-2">
            <v-checkbox label="Is activity unavoidable" v-model="formData.isObligatoryActivity"></v-checkbox>
            <v-checkbox label="Place on to-do list" v-model="formData.isOnToDoList"></v-checkbox>
        </div>

        <v-row justify="center">
            <v-dialog v-model="dialog" persistent max-width="1024">
                <template v-slot:activator="{ props }">
                    <v-btn color="primary" v-bind="props">Create</v-btn>
                </template>
                <v-card>
                    <v-card-title>
                        <span class="text-h5">User Profile</span>
                    </v-card-title>
                    <v-card-text>
                        <v-container>
                            <v-row>
                                <v-col cols="12" sm="6" md="4">
                                    <v-text-field label="Legal first name*" required></v-text-field>
                                </v-col>
                            </v-row>
                        </v-container>
                        <small>*indicates required field</small>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="blue-darken-1" variant="text" @click="dialog = false"> Close </v-btn>
                        <v-btn color="blue-darken-1" variant="text" @click="dialog = false"> Save </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-row>
    </v-container>
</template>
<script>
    import axios from 'axios';
    import MyModalTemplate from './modals/MyModalTemplate.vue';
    export default {
        components: {
            MyModalTemplate
        },
        data() {
            return {
                formData: {
                    roleId: 1,
                    customRole: '',
                    categoryId: 0,
                    customCategory: '',
                    activity: '',
                    isCustomRole: false,
                    isCustomCategory: false,
                    isObligatoryActivity: false,
                    isOnToDoList: false,
                },
                roleOptions: [{ label: 'role', id: '1' }],
                categoryOptions: [{ label: 'cat', id: '1' },{ label: 'aaaaaaaa', id: '0' }],
                dialog: false,
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
                    roleId: 0,
                    customRole: '',
                    categoryId: 0,
                    customCategory: '',
                    activity: '',
                    isCustomRole: false,
                    isCustomCategory: false,
                    isObligatoryActivity: false,
                    isOnToDoList: false,
                };
            },
            createNewActivity() {
                axios
                    .post('/activity/create', this.formData)
                    .then((response) => {
                        alert('Created new activity');
                        console.log(response);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            },
        },
        watch() {
            formData.categoryId
        }
    };
</script>
