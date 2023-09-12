<template>
    <v-container fluid>
        <v-row class="justify-center py-2" align="center">
            <v-col cols="auto" class="py-2">
                <v-checkbox label="From to-do list" v-model="isFromToDoList" hide-details="true" :disabled="formDisabled"></v-checkbox>
            </v-col>
            <v-col v-show="isFromToDoList" cols="12" md="5" lg="3" class="pb-4 pt-2 py-lg-0">
                <v-select v-model="selectedUrgency" label="Task urgency" :items="taskUrgencyOptions" variant="outlined" item-value="id" item-title="text" hide-details="lg" clearable></v-select>
            </v-col>
            <v-col cols="12">
                <v-row>
                    <v-col cols="12" lg="5" class="py-2">
                        <v-autocomplete v-model="selectedRole" :items="roleOptions" :disabled="formDisabled" label="Role" variant="outlined" item-value="id" item-title="label" clearable></v-autocomplete>
                    </v-col>
                    <v-col cols="12" lg="7" class="py-2">
                        <v-autocomplete v-model="selectedCategory" :items="categoryOptions" :disabled="formDisabled" label="Category" variant="outlined" item-value="id" item-title="label" clearable></v-autocomplete>
                    </v-col>
                    <v-col cols="12" class="py-2">
                        <v-autocomplete v-model="selectedActivity" :items="activityOptions" :disabled="formDisabled" label="Activity" variant="outlined" item-value="id" item-title="label" clearable></v-autocomplete>
                    </v-col>
                </v-row>
            </v-col>
            <v-col cols="auto" class="py-2">
                <v-btn @click="createNewActivity()" color="success">Vytvoriť novú aktivitu</v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        props: {
            activityLength: {
                type: Object,
                required: true,
            },
            startTimestamp: {
                type: Number,
                required: true,
            },
            formDisabled: {
                type: Boolean,
                required: true,
                default: false
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
            this.populateSelects('toDoListOptions', '/to-do-list/get-all');
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
                this.updateCategoriesAndActivities;
            },
            selectedCategory(newValue) {
                console.log(newValue);
                this.updateActivities;
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
            addActivityToHistory() {
                const startInMillis = this.startTimestamp - (this.activityLength.hours * 3600 + this.activityLength.minutes * 60 + this.activityLength.seconds) * 1000;
                const start = new Date(startInMillis);
                const newRecordRequest = {
                    startTimestamp: start.toISOString(),
                    length: this.activityLength,
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
