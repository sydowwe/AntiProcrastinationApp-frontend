<template>
    <VRow class="justify-center" align="center" noGutters>
        <VCol cols="auto" class="pb-0 pb-md-4">
            <VCheckbox label="From to-do list" v-model="isFromToDoList" :disabled="formDisabled" hide-details></VCheckbox>
        </VCol>
        <VCol v-show="isFromToDoList" cols="12" md="5" lg="3" class="pt-1 pb-5 pb-md-4">
            <VSelect v-model="selectedUrgencyId" :items="selectOptions.taskUrgency" hide-details></VSelect>
        </VCol>
        <VCol cols="12" class="pt-1">
            <VRow>
                <VCol cols="12" lg="5">
                    <VAutocomplete label="Role" v-model="selectedRoleId" :items="selectOptions.role" :disabled="formDisabled" hide-details></VAutocomplete>
                </VCol>
                <VCol cols="12" lg="7">
                    <VAutocomplete label="Category" v-model="selectedCategoryId" :items="selectOptions.category" :disabled="formDisabled" hide-details></VAutocomplete>
                </VCol>
                <VCol cols="12">
                    <VAutocomplete label="Activity" v-model="selectedActivityId" :items="selectOptions.activity" :disabled="formDisabled" hide-details></VAutocomplete>
                </VCol>
            </VRow>
        </VCol>
        <VCol cols="auto" class="mt-4">
            <VBtn @click="createNewActivity()" color="primary">Vytvoriť novú aktivitu</VBtn>
        </VCol>
    </VRow>
</template>

<script setup lang="ts">
//populate selects composition

    import { reactive, ref, computed, watch } from 'vue';
    import { TimeObject } from '../classes/TimeUtils';
    import { IdLabelOption } from '../classes/IdLabelOption';
    import { importDefaults } from '../compositions/Defaults';
    const { router, showErrorSnackbar, hideErrorSnackbar } = importDefaults();

    const props = defineProps({
        formDisabled: {
            type: Boolean,
            required: true,
            default: false,
        },
    });

    const selectOptions = reactive({
        taskUrgency: [] as IdLabelOption[],
        role: [] as IdLabelOption[],
        category: [] as IdLabelOption[],
        activity: [] as IdLabelOption[],
    });

    const isFromToDoList = ref(false);
    const selectedUrgencyId = ref(1);
    const selectedRoleId = ref(null as number | null);
    const selectedCategoryId = ref(null as number | null);
    const selectedActivityId = ref(null as number | null);

    populateSelects('taskUrgency', '/urgency/get-all');
    populateSelects('role', '/role/get-all-options');
    populateSelects('category', '/category/get-all-options');
    populateSelects('activity', '/activity/get-all-options');

    const selectedActivityName = computed(() => {
        let name = selectOptions.activity.find((item) => item.id === selectedActivityId.value)?.label ?? undefined;
        return name;
    });
    watch(selectedRoleId, (newValue) => {
        updateCategoriesAndActivities();
    });
    watch(selectedCategoryId, (newValue) => {
        updateRolesAndActivities();
    });
    function validate() {
        return selectedActivityId.value != null ? true : false;
    }
    function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
        axios
            .post(url)
            .then((response) => {
                selectOptions[dataKey] = IdLabelOption.listFromObjects(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }
    function updateRolesAndActivities() {
        selectedActivityId.value = null;
        if (selectedCategoryId.value) {
            populateSelects('role', `/role/get-options-by-category/${selectedCategoryId.value}`);
            updateActivitiesBy('category');
        } else {
            populateSelects('role', '/role/get-all-options');
            populateSelects('activity', '/activity/get-all-options');
        }
    }
    function updateCategoriesAndActivities() {
        selectedActivityId.value = null;
        if (selectedRoleId.value) {
            populateSelects('category', `/category/get-options-by-role/${selectedRoleId.value}`);
            updateActivitiesBy('role');
        } else {
            populateSelects('category', '/category/get-all-options');
            populateSelects('activity', '/activity/get-all-options');
        }
    }
    function updateActivitiesBy(byWhat: string) {
        selectedActivityId.value = null;
        if (selectedCategoryId.value || selectedRoleId.value) {
            populateSelects('activity', `/activity/get-options-by-${byWhat === 'category' ? 'category/' + selectedCategoryId.value : 'role/' + selectedRoleId.value}`);
        } else {
            selectOptions.activity = [];
        }
    }
    function addActivityToHistory(activityLength: TimeObject, startTimestamp: string) {
        const start = new Date(startTimestamp);
        const newRecordRequest = {
            startTimestamp: start.toISOString(),
            length: activityLength,
            activityId: selectedActivityId.value,
        };
        axios
            .post('/history/add-new-record', newRecordRequest)
            .then((response) => {
                alert('Added record of activity to history');
            })
            .catch((error) => {
                console.log(error);
            });
    }
    function createNewActivity() {
        router.push({ name: 'createNewActivity' });
    }
    defineExpose({ validate, addActivityToHistory, selectedActivityName });
</script>
