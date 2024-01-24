<template>
    <VRow class="justify-center" align="center" noGutters>
        <VCol cols="auto" class="pb-0 pb-md-4">
            <VCheckbox label="From to-do list" v-model="isFromToDoList" :disabled="formDisabled" hide-details></VCheckbox>
        </VCol>
        <VCol v-show="isFromToDoList" cols="12" md="5" lg="3" class="pt-1 pb-5 pb-md-4">
            <VSelect v-model="selectedUrgencyId" :items="taskUrgencyOptions" hide-details></VSelect>
        </VCol>
        <VCol cols="12" class="pt-1">
            <VRow>
                <VCol cols="12" lg="5">
                    <VAutocomplete label="Role" v-model="selectedRoleId" :items="roleOptions" :disabled="formDisabled" hide-details></VAutocomplete>
                </VCol>
                <VCol cols="12" lg="7">
                    <VAutocomplete label="Category" v-model="selectedCategoryId" :items="categoryOptions" :disabled="formDisabled" hide-details></VAutocomplete>
                </VCol>
                <VCol cols="12">
                    <VAutocomplete label="Activity" v-model="selectedActivityId" :items="activityOptions" :disabled="formDisabled" hide-details></VAutocomplete>
                </VCol>
            </VRow>
        </VCol>
        <VCol cols="auto" class="mt-4">
            <VBtn @click="createNewActivity()" color="primary">Vytvoriť novú aktivitu</VBtn>
        </VCol>
    </VRow>
</template>

<script lang="ts">
//TODOCOMPOSITION
    import { defineComponent } from 'vue';
    import { TimeObject } from '../classes/TimeUtils';
    import { UrgencyEntity } from '../classes/UrgencyEntity';
    import { IdLabelOption } from '../classes/IdLabelOption';
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
            this.populateSelects('roleOptions', '/role/get-all-options');
            this.populateSelects('categoryOptions', '/category/get-all-options');
            this.populateSelects('activityOptions', '/activity/get-all-options');
        },
        computed: {
            selectedActivityName() {
                let name = this.activityOptions.find((item) => item.id === this.selectedActivityId)?.label ?? undefined;
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
                    this.populateSelects('roleOptions', `/role/get-options-by-category/${this.selectedCategoryId}`);
                    this.updateActivitiesBy('category');
                } else {
                    this.populateSelects('roleOptions', '/role/get-all-options');
                    this.populateSelects('activityOptions', '/activity/get-all-options');
                }
            },
            updateCategoriesAndActivities() {
                this.selectedActivityId = null;
                if (this.selectedRoleId) {
                    this.populateSelects('categoryOptions', `/category/get-options-by-role/${this.selectedRoleId}`);
                    this.updateActivitiesBy('role');
                } else {
                    this.populateSelects('categoryOptions', '/category/get-all-options');
                    this.populateSelects('activityOptions', '/activity/get-all-options');
                }
            },
            updateActivitiesBy(byWhat: string) {
                this.selectedActivityId = null;
                if (this.selectedCategoryId || this.selectedRoleId) {
                    this.populateSelects('activityOptions', `/activity/get-options-by-${byWhat === 'category' ? 'category/' + this.selectedCategoryId : 'role/' + this.selectedRoleId}`);
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
../classes/IdLabelOption