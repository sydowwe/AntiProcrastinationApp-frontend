<template>
    <VRow class="justify-center my-2" align="center">
        <VCol cols="12" lg="5" md="6">
            <v-autocomplete label="Role" v-model="filterData.roleId" :items="roleOptions" hide-details></v-autocomplete>
        </VCol>
        <VCol cols="12" lg="7" md="6">
            <v-autocomplete label="Category" v-model="filterData.categoryId" :items="categoryOptions" hide-details></v-autocomplete>
        </VCol>
    </VRow>
    <div class="d-flex flex-md-row flex-column-reverse my-3 mb-2 mb-md-3">
        <v-checkbox class="flex-grow-0 pr-md-3 mx-auto mt-2 mt-md-0" label="From to-do list" v-model="filterData.isFromToDoList" hide-details></v-checkbox>
        <v-autocomplete label="Activity" v-model="filterData.activityId" class="flex-grow-1" :items="activityOptions" hide-details></v-autocomplete>
    </div>
    <div class="d-flex flex-column flex-md-row mb-3">
        <VTextField v-if="dateRange" class="mt-3" :label="$t('history.dateFrom')" v-model="dateFromNice" clearable @click:clear="clearDateFrom" readonly hide-details>
            <VMenu activator="parent" lazy :close-on-content-click="false" v-model="showDateFromPicker" transition="scale-transition" style="width: fit-content !important">
                <VDatePicker v-model="filterData.dateFrom" :max="Date.now()" title="" cancel-text="Clear" @click:cancel="clearDateFrom" @click:save="showDateFromPicker = false" :multiple="false">
                    <template v-slot:header></template>
                </VDatePicker>
            </VMenu>
        </VTextField>
        <div v-else class="flex-1-0 d-flex flex-column flex-md-row mt-3">
            <div class="d-flex flex-1-0 align-center">
                <VTextField class="flex-0-1" v-model="filterData.hoursBack" :min="2" :max="72" type="number" :clearable="false" hide-details></VTextField>
                <VLabel class="ml-2">{{ $t('dateTime.hoursBack') }}</VLabel>
                <v-slider class="flex-1-0 mx-2" v-model="filterData.hoursBack" :min="2" :max="72" :step="1" hide-details></v-slider>
            </div>
        </div>
        <div class="flex-1-0 d-flex align-center mb-3 mb-md-0 mt-md-3">
            <VCheckbox class="flex-0-1 mx-2 mx-md-3" v-model="dateRange" :label="$t('dateTime.dateRange')" hide-details density="compact"></VCheckbox>
            <VTextField class="flex-1-0"  :label="$t('dateTime.dateTo')" v-model="dateToNice" clearable @click:clear="clearDateTo" readonly hide-details>
                <VMenu activator="parent" lazy :close-on-content-click="false" v-model="showDateToPicker" transition="scale-transition" style="width: fit-content !important">
                    <VDatePicker v-model="filterData.dateTo" :max="Date.now()" title="" cancel-text="Clear" @click:cancel="clearDateTo" @click:save="showDateToPicker = false" :multiple="false">
                        <template v-slot:header></template>
                    </VDatePicker>
                </VMenu>
            </VTextField>
        </div>
    </div>
    <VRow class="justify-center my-0">
        <VCol cols="12" lg="4" md="5">
            <VBtn class="w-100" @click="applyFilter" color="primary">Filter</VBtn>
        </VCol>
    </VRow>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { VDatePicker } from 'vuetify/labs/VDatePicker';
    import { HistoryFilter } from '../classes/History';
    import { Role } from '../classes/DTOs/Role';
    import { Category } from '../classes/DTOs/Category';
    import { Activity } from '../classes/DTOs/Activity';
    import { ActivityRecord } from '../classes/ActivityRecord';

    export default defineComponent({
        components: {
            VDatePicker,
        },
        data() {
            return {
                filterData: new HistoryFilter(),
                roleOptions: [] as Role[],
                categoryOptions: [] as Category[],
                activityOptions: [] as Activity[],
                showDateFromPicker: false,
                showDateToPicker: false,
                dateRange: false,
            };
        },
        created() {
            this.populateSelects('roleOptions', '/role/get-all-options');
            this.populateSelects('categoryOptions', '/category/get-all-options');
            this.populateSelects('activityOptions', '/activity/get-all-options');
        },
        mounted() {},
        computed: {
            dateFromNice() {
                if (this.filterData.dateFrom) {
                    return this.filterData.dateFrom.toLocaleDateString();
                } else {
                    return null;
                }
            },
            dateToNice() {
                if (this.filterData.dateTo) {
                    return this.filterData.dateTo.toLocaleDateString();
                } else {
                    return null;
                }
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
            isFromToDoList(newValue) {
                console.log(newValue);
            },
        },
        methods: {
            clearDateFrom() {
                this.filterData.dateFrom = null;
                this.showDateFromPicker = false;
            },
            clearDateTo() {
                this.filterData.dateTo = null;
                this.showDateToPicker = false;
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
            updateCategoriesAndActivities() {
                this.filterData.categoryId = null;
                this.filterData.activityId = null;
                if (this.filterData.roleId) {
                    this.populateSelects('categoryOptions', `/category/get-options-by-role/${this.filterData.roleId}`);
                } else {
                    this.categoryOptions = [];
                    this.activityOptions = [];
                }
            },
            updateActivities() {
                this.filterData.activityId = null;
                if (this.filterData.categoryId) {
                    this.populateSelects('activityOptions', `/activity/get-options-by-category/${this.filterData.categoryId}`);
                } else {
                    this.activityOptions = [];
                }
            },
            applyFilter() {
                let filter = { ...this.filterData };

                if (this.dateRange) {
                    filter.hoursBack = null;
                } else {
                    filter.dateTo = null;
                }
                axios
                    .post(`/history/filter`, filter)
                    .then((response) => {
                        this.$emit(
                            'filterApplied',
                            response.data.map((item: ActivityRecord) => ActivityRecord.fromObject(item))
                        );
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            },
        },
        emits: {
            filterApplied: (records: ActivityRecord[]) => true,
        },
    });
</script>
