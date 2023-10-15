<template>
    <v-container fluid>
        <v-row class="justify-center my-2" align="center">
            <v-col cols="12" lg="5" md="6">
                <v-autocomplete label="Role" v-model="selectedRole" :items="roleOptions" hide-details></v-autocomplete>
            </v-col>
            <v-col cols="12" lg="7" md="6">
                <v-autocomplete label="Category" v-model="selectedCategory" :items="categoryOptions" hide-details></v-autocomplete>
            </v-col>
        </v-row>
        <div class="d-flex flex-md-row flex-column-reverse my-md-3">
            <v-checkbox class="flex-grow-0 pr-md-3 mx-auto mt-2 mt-md-0" label="From to-do list" v-model="isFromToDoList" hide-details="true"></v-checkbox>
            <v-autocomplete label="Activity" v-model="selectedActivity" class="flex-grow-1" :items="activityOptions" hide-details></v-autocomplete>
        </div>
        <v-row class="justify-center my-0" align="center">
            <v-col cols="12" lg="5" md="6">
                <VTextField label="Date from" v-model="dateNice" :clearable="false" readonly hide-details>
                    <VMenu activator="parent" ref="menuRef" lazy :close-on-content-click="false" v-model="menuValue" transition="scale-transition">
                        <VDatePicker v-model="datePickerValue" :max="Date.now()" title="" @click:cancel="menuValue = false" @click:save="menuValue = false">
                            <template v-slot:header></template>
                        </VDatePicker>
                    </VMenu>
                </VTextField>
            </v-col>
            <v-col cols="12" lg="7" md="6">
                <v-slider label="Hours back" v-model="hoursBack" :max="72" :step="1" hide-details class="mx-0">
                    <template v-slot:append>
                        <VTextField v-model="hoursBack" :min="0" :max="72" type="number" style="width: 80px" hide-details></VTextField>
                    </template>
                </v-slider>
            </v-col>
        </v-row>
        <v-row class="justify-center my-0">
            <v-col cols="12" lg="4" md="5">
                <VBtn class="w-100" @click="applyFilter" color="primary">Filter</VBtn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import { VDatePicker } from 'vuetify/labs/VDatePicker';
    export default {
        components: {
            VDatePicker,
        },
        props: {},
        data() {
            return {
                isFromToDoList: false,
                selectedRole: null,
                roleOptions: [],
                selectedCategory: null,
                categoryOptions: [],
                selectedActivity: null,
                activityOptions: [],
                menuValue: false,
                datePickerValue: new Date(),
                hoursBack: 24,
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
                if (this.datePickerValue) {
                    const date = new Date(this.datePickerValue);
                    return date.toLocaleDateString();
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
            applyFilter() {
                const filterData = {
                    selectedRole: this.selectedRole,
                    selectedCategory: this.selectedCategory,
                    selectedActivity: this.selectedActivity,
                    isFromToDoList: this.isFromToDoList,
                    date: this.datePickerValue,
                    hoursBack: this.hoursBack,
                };
                this.$emit('filter-applied', filterData);
            },
        },
        emits: ['filter-applied'],
    };
</script>
