<template>
    <v-row class="justify-center" align="center">
        <v-col cols="auto" class="pb-0 pb-md-4">
            <v-checkbox label="From to-do list" v-model="isFromToDoList" :disabled="formDisabled" hide-details></v-checkbox>
        </v-col>
        <v-col v-show="isFromToDoList" cols="12" md="5" lg="3" class="pt-1 pb-5 pb-md-4">
            <v-select v-model="selectedUrgencyId" :items="taskUrgencyOptions" hide-details></v-select>
        </v-col>
        <v-col cols="12" class="pt-1">
            <v-row>
                <v-col cols="12" lg="5">
                    <v-autocomplete label="Role" v-model="selectedRoleId" :items="roleOptions" :disabled="formDisabled" hide-details></v-autocomplete>
                </v-col>
                <v-col cols="12" lg="7">
                    <v-autocomplete label="Category" v-model="selectedCategoryId" :items="categoryOptions" :disabled="formDisabled" hide-details></v-autocomplete>
                </v-col>
                <v-col cols="12">
                    <v-autocomplete label="Activity" v-model="selectedActivityId" :items="activityOptions" :disabled="formDisabled" hide-details></v-autocomplete>
                </v-col>
            </v-row>
        </v-col>
        <v-col cols="auto" class="py-2">
            <v-btn @click="createNewActivity()" color="primary">Vytvoriť novú aktivitu</v-btn>
        </v-col>
    </v-row>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { TimeObject } from '../classes/TimeUtils';
    import { UrgencyEntity } from '../classes/UrgencyEntity';
import { IdLabelOption } from '../classes/DTOs/IdLabelOption';
    export default defineComponent({
        props: {
            formDisabled: {
                type: Boolean,
                required: true,
                default: false,
            },
        },
        data() {
            return {
                selectedUrgencyId: 1,
                taskUrgencyOptions: [] as UrgencyEntity[],
                isFromToDoList: false,
                selectedRoleId: null as number | null,
                roleOptions: [] as IdLabelOption[],
                selectedCategoryId: null as number | null,
                categoryOptions: [] as IdLabelOption[],
                selectedActivityId: null as number | null,
                activityOptions: [] as IdLabelOption[],
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
                    this.activityOptions.find((item) => item.id === this.selectedActivityId)?.label ?? undefined;
                return name;
            },
        },
        watch: {
            selectedRoleId(newValue) {
                this.updateCategoriesAndActivities();
            },
            selectedCategoryId(newValue) {
                this.updateRolesAndActivities();
            },
            selectedActivityId(newValue) {},
        },
        methods: {
            validate() {
                return this.selectedActivityId != null ? true : false;
            },
            populateSelects(dataKey: string, url: string) {
                axios
                    .post(url)
                    .then((response) => {
                        (this as any)[dataKey] = response.data;
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
            updateRolesAndActivities() {
                this.selectedActivityId = null;
                if (this.selectedCategoryId) {
                    this.populateSelects('roleOptions', `/role/get-by-category/${this.selectedCategoryId}`);
                    this.updateActivitiesBy('category');
                } else {
                    this.populateSelects('roleOptions', '/role/get-all');
                    this.populateSelects('activityOptions', '/activity/get-all');
                }
            },
            updateCategoriesAndActivities() {
                this.selectedActivityId = null;
                if (this.selectedRoleId) {
                    this.populateSelects('categoryOptions', `/category/get-by-role/${this.selectedRoleId}`);
                    this.updateActivitiesBy('role');
                } else {
                    this.populateSelects('categoryOptions', '/category/get-all');
                    this.populateSelects('activityOptions', '/activity/get-all');
                }
            },
            updateActivitiesBy(byWhat: string) {
                this.selectedActivityId = null;
                if (this.selectedCategoryId || this.selectedRoleId) {
                    this.populateSelects('activityOptions', `/activity/get-by-${byWhat === 'category' ? 'category/' + this.selectedCategoryId : 'role/' + this.selectedRoleId}`);
                } else {
                    this.activityOptions = [];
                }
            },
            addActivityToHistory(activityLength: TimeObject, startTimestamp: string) {
                const start = new Date(startTimestamp);
                const newRecordRequest = {
                    startTimestamp: start.toISOString(),
                    length: activityLength,
                    activityId: this.selectedActivityId,
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
                this.$router.push({ name: 'createNewActivity' });
            },
        },
    });
</script>
