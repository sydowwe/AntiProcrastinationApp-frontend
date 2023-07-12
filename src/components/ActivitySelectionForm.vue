<template>
    <v-container fluid>
        <v-row class="justify-center py-2" align="center">
            <v-col cols="auto" class="py-2">
                <v-checkbox label="From to-do list" v-model="isFromToDoList" hide-details="true"></v-checkbox>
            </v-col>
            <v-col v-if="isFromToDoList" cols="12" md="5" lg="3" class="pb-4 pt-2 py-lg-0">
                <v-select v-model="selectedUrgency" label="Task urgency" :items="taskUrgencyOptions" variant="outlined" hide-details="lg" clearable></v-select>
            </v-col>
            <v-col cols="12">
                <v-row>
                    <v-col cols="12" lg="5" class="py-2">
                        <v-autocomplete v-model="selectedRole" :items="roleOptions" label="Role" variant="outlined" clearable></v-autocomplete>
                    </v-col>
                    <v-col cols="12" lg="7" class="py-2">
                        <v-autocomplete v-model="selectedCategory" :items="categoryOptions" label="Category" variant="outlined" clearable></v-autocomplete>
                    </v-col>
                    <v-col cols="12" class="py-2">
                        <v-autocomplete v-model="selectedActivity" :items="activityOptions" label="Activity" variant="outlined" clearable></v-autocomplete>
                    </v-col>
                </v-row>
            </v-col>
            <v-col cols="auto" class="py-2">
                <v-btn @click="addNewActivity" color="success">Pridať novú aktivitu</v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        props: {
            activityLength: {
                type: Number,
                default: 0,
            },
        },
        data() {
            return {
                selectedUrgency: null,
                taskUrgencyOptions: [
                    { title: 'Today', value: 1 },
                    { title: 'High Priority / Urgent', value: 2 },
                    { title: 'Medium Priority', value: 3 },
                    { title: 'Low Priority', value: 4 },
                    { title: 'Future / Long-Term', value: 5 },
                    { title: 'On Hold', value: 6 },
                ],
                isFromToDoList: false,
                selectedRole: null,
                roleOptions: [],
                selectedCategory: null,
                categoryOptions: [],
                selectedActivity: null,
                activityOptions: [],
            };
        },
        created() {
            this.populateSelects('toDoListOptions', '/to-do-list/get-all');
            this.populateSelects('roleOptions', '/role/get-all');
            this.populateSelects('categoryOptions', '/category/get-all');
            this.populateSelects('activityOptions', '/activity/get-all');
        },
        watch: {
            selectedRole(newValue) {
                console.log(newValue);
                this.updateCategoriesAndActivities;
            },
            selectedCategory(newValue) {
                console.log(newValue);
                this.updateActivities;
            },
        },
        methods: {
            populateSelects(dataKey, url) {
                axios
                    .get(url)
                    .then((response) => {
                        this[dataKey] = response.data;
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
            updateCategoriesAndActivities() {
                this.selectedCategory = null;
                this.selectedActivity = null;
                if (this.selectedRole) {
                    this.populateSelects('categoryOptions', `/category/get-by-role/${this.selectedRole.id}`);
                } else {
                    this.categoryOptions = [];
                    this.activityOptions = [];
                }
            },
            updateActivities() {
                this.selectedActivity = null;
                if (this.selectedCategory) {
                    this.populateSelects('activityOptions', `/activity/get-by-category/${this.selectedCategory.id}`);
                } else {
                    this.activityOptions = [];
                }
            },
            addNewActivity() {
                const startInMillis = Date.now() - this.activityLength;
                const start = new Date(startInMillis);

                const recordJsonObject = {
                    id: parseInt(this.selectedActivity.id),
                    length: this.activityLength,
                    timeOfStart: start.toISOString().replace('T', ' ').replace('Z', ''),
                    roleId: parseInt(this.selectedRole.id),
                    categoryId: parseInt(this.selectedCategory.id),
                };

                axios
                    .post('/newRecord/add-new-activity-to-history', recordJsonObject)
                    .then((response) => {
                        alert('Added record of activity to history');
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
        },
    };
</script>
