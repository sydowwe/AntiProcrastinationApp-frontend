<template>
    <v-row class="justify-center my-2" align="center">
        <v-col cols="12" lg="5" md="6">
            <v-autocomplete label="Role" v-model="filterData.selectedRole" :items="roleOptions" hide-details></v-autocomplete>
        </v-col>
        <v-col cols="12" lg="7" md="6">
            <v-autocomplete label="Category" v-model="filterData.selectedCategory" :items="categoryOptions" hide-details></v-autocomplete>
        </v-col>
    </v-row>
    <div class="d-flex flex-md-row flex-column-reverse my-md-3">
        <v-checkbox class="flex-grow-0 pr-md-3 mx-auto mt-2 mt-md-0" label="From to-do list" v-model="filterData.isFromToDoList" hide-details></v-checkbox>
        <v-autocomplete label="Activity" v-model="filterData.selectedActivity" class="flex-grow-1" :items="activityOptions" hide-details></v-autocomplete>
    </div>
    <v-row class="justify-center my-0" align="center">
        <v-col cols="12" lg="5" md="6">
            <VTextField label="Date from" v-model="dateNice" :clearable="false" readonly hide-details>
                <VMenu activator="parent" ref="menuRef" lazy :close-on-content-click="false" v-model="menuValue" transition="scale-transition">
                    <VDatePicker v-model="filterData.date" :max="Date.now()" title="" @click:cancel="menuValue = false" @click:save="menuValue = false" :multiple="false">
                        <template v-slot:header></template>
                    </VDatePicker>
                </VMenu>
            </VTextField>
        </v-col>
        <v-col cols="12" lg="7" md="6" class="d-flex flex-column flex-md-row">
            <VLabel>Hours back</VLabel>
            <div class="d-flex flex-1-0 align-center">
                <v-slider class="flex-1-0 mx-2 mx-md-4" v-model="filterData.hoursBack" :min="0" :max="72" :step="1" hide-details></v-slider>
                <VTextField class="flex-0-1" v-model="filterData.hoursBack" :min="0" :max="72" type="number" :clearable="false" hide-details></VTextField>
            </div>
        </v-col>
    </v-row>
    <v-row class="justify-center my-0">
        <v-col cols="12" lg="4" md="5">
            <VBtn class="w-100" @click="applyFilter" color="primary">Filter</VBtn>
        </v-col>
    </v-row>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { VDatePicker } from 'vuetify/labs/VDatePicker';
    import { HistoryFilter } from '../classes/History';
    import { Role } from '../classes/DTOs/Role';
    import { Category } from '../classes/DTOs/Category';
    import { Activity } from '../classes/DTOs/Activity';
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
                menuValue: false,
            };
        },
        created() {
            this.populateSelects('roleOptions', '/role/get-all');
            this.populateSelects('categoryOptions', '/category/get-all');
            this.populateSelects('activityOptions', '/activity/get-all');
        },
        mounted() {
            this.applyFilter();
        },
        computed: {
            dateNice() {
                if (this.filterData.date) {                    
                    return this.filterData.date.toLocaleDateString();
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
                this.filterData.selectedCategory = null;
                this.filterData.selectedActivity = null;
                if (this.filterData.selectedRole) {
                    this.populateSelects('categoryOptions', `/category/get-by-role/${this.filterData.selectedRole}`);
                } else {
                    this.categoryOptions = [];
                    this.activityOptions = [];
                }
            },
            updateActivities() {
                this.filterData.selectedActivity = null;
                if (this.filterData.selectedCategory) {
                    this.populateSelects('activityOptions', `/activity/get-by-category/${this.filterData.selectedCategory}`);
                } else {
                    this.activityOptions = [];
                }
            },
            applyFilter() {
                this.$emit('filterApplied', this.filterData);
            },
        },
        emits: {
            filterApplied: (filterData: HistoryFilter) => true,
        },
    });
</script>
