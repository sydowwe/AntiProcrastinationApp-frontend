<template>
    <v-row class="justify-center" align="center">
        <v-col cols="auto" class="pb-0 pb-md-4">
            <v-checkbox label="From to-do list" v-model="isFromToDoList" :disabled="formDisabled" hide-details></v-checkbox>
        </v-col>
        <v-col v-show="isFromToDoList" cols="12" md="5" lg="3" class="pt-1 pb-5 pb-md-4">
            <v-select v-model="selectedUrgency" :items="taskUrgencyOptions" hide-details="lg"></v-select>
        </v-col>
        <v-col cols="12" class="pt-1">
            <v-row>
                <v-col cols="12" lg="5">
                    <v-autocomplete label="Role" v-model="selectedRole" :items="roleOptions" :disabled="formDisabled" hide-details></v-autocomplete>
                </v-col>
                <v-col cols="12" lg="7">
                    <v-autocomplete label="Category" v-model="selectedCategory" :items="categoryOptions" :disabled="formDisabled" hide-details></v-autocomplete>
                </v-col>
                <v-col cols="12">
                    <v-autocomplete label="Activity" v-model="selectedActivity" :items="activityOptions" :disabled="formDisabled" hide-details></v-autocomplete>
                </v-col>
            </v-row>
        </v-col>
        <v-col cols="auto" class="py-2">
            <v-btn @click="createNewActivity()" color="primary">Vytvoriť novú aktivitu</v-btn>
        </v-col>
    </v-row>
</template>

<script>
    export default {
        props: {
            formDisabled: {
                type: Boolean,
                required: true,
                default: false,
            },
        },
        data() {
            return {
                selectedUrgency: null,
                taskUrgencyOptions: [],
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
            this.populateSelects('taskUrgencyOptions', '/urgency/get-all');
            this.populateSelects('roleOptions', '/role/get-all');
            this.populateSelects('categoryOptions', '/category/get-all');
            this.populateSelects('activityOptions', '/activity/get-all');
        },
        computed: {
            selectedActivityName() {
                let name =
                    this.activityOptions.find((item) => {
                        return item.id === this.selectedActivity;
                    })?.label ?? null;
                return name;
            },
        },
        watch: {
            selectedRole(newValue) {
                console.log(newValue);
                this.updateCategoriesAndActivities();
            },
            selectedCategory(newValue) {
                console.log(newValue);
                this.updateRolesAndActivities();
            },
            selectedActivity(newValue) {},
        },
        methods: {
            isValid() {
                return this.selectedActivity != null ? true : false;
            },
            populateSelects(dataKey, url) {
                axios
                    .post(url)
                    .then((response) => {
                        this[dataKey] = response.data;
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
            updateRolesAndActivities() {
                this.selectedActivity = null;
                if (this.selectedCategory) {
                    this.populateSelects('roleOptions', `/role/get-by-category/${this.selectedCategory}`);
                    this.updateActivitiesBy('category');
                } else {
                    this.populateSelects('roleOptions', '/role/get-all');
                    this.populateSelects('activityOptions', '/activity/get-all');
                }
            },
            updateCategoriesAndActivities() {
                this.selectedActivity = null;
                if (this.selectedRole) {
                    this.populateSelects('categoryOptions', `/category/get-by-role/${this.selectedRole}`);
                    this.updateActivitiesBy('role');
                } else {
                    this.populateSelects('categoryOptions', '/category/get-all');
                    this.populateSelects('activityOptions', '/activity/get-all');
                }
            },
            updateActivitiesBy(byWhat) {
                this.selectedActivity = null;
                if (this.selectedCategory || this.selectedRole) {
                    this.populateSelects('activityOptions', `/activity/get-by-${byWhat === 'category' ? 'category/' + this.selectedCategory : 'role/' + this.selectedRole}`);
                } else {
                    this.activityOptions = [];
                }
            },
            addActivityToHistory(activityLength, startTimestamp) {
                const start = new Date(startTimestamp);
                const newRecordRequest = {
                    startTimestamp: start.toISOString(),
                    length: activityLength,
                    activityId: parseInt(this.selectedActivity),
                };
                axios
                    .post('/history/add-new-record', newRecordRequest)
                    .then((response) => {
                        alert('Added record of activity to history');
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
            createNewActivity() {
                this.$router.push('/createNewActivity');
            },
        },
    };
</script>
