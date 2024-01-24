<template>
    <VRow justify="center" noGutters>
        <VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
            <VRow class="mt-5" align="center" justify="center">
                <VCol class="bordered bordered-left" cols="12" md="7">
                    <VLabel>{{ $t('dateTime.when') }}</VLabel>
                    <DateTimePicker @dateTimeSet="updateDateTime"></DateTimePicker>
                </VCol>
                <VCol class="bordered bordered-right" cols="12" md="5">
                    <VLabel>{{ $t('dateTime.length') }}</VLabel>
                    <TimePicker @timeChange="updateLengthOfActivity"></TimePicker>
                </VCol>
                <VCol cols="auto">
                    <VBtn @click="saveActivity()" color="success">{{ $t('history.addActivityToHistory') }}</VBtn>
                </VCol>
            </VRow>
        </VCol>
    </VRow>
</template>
<script setup lang="ts">
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import SaveActivityDialog from '../components/dialogs/SaveActivityDialog.vue';
    import TimePicker from '../components/TimePicker.vue';
    import DateTimePicker from '../components/DateTimePicker.vue';
    import { TimeObject } from '../classes/TimeUtils';
    import { ActivitySelectionFormType, FeedBackType } from '../classes/types/RefTypeInterfaces';
    import { ref } from 'vue';
    import importDefaults from '../compositions/Defaults';
    const { i18n, showErrorSnackbar } = importDefaults();

    const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
    const formDisabled = ref(false);
    const dateTime = ref(new Date());
    const lengthOfActivity = ref(new TimeObject());

    function saveActivity() {
        if (activitySelectionForm.value.validate()) {
            if (dateTime.value.valueOf() <= Date.now()) {
                if (lengthOfActivity.value.isNotZero()) {
                    activitySelectionForm.value?.addActivityToHistory(lengthOfActivity.value, dateTime.value.valueOf());
                } else {
                    showErrorSnackbar(i18n.t('history.lengthNotSet'));
                }
            } else {
                alert('Really wanna add activity in future');
            }
        } else {
            alert('select activity');
        }
    }
    function updateDateTime(dateTimeIn: Date) {
        dateTime.value = dateTimeIn;
    }
    function updateLengthOfActivity(formattedTime: TimeObject | undefined) {
        lengthOfActivity.value = formattedTime ?? new TimeObject(0, 0, 0);
    }
</script>
<style scoped>
    .bordered {
        border: 1px solid white;
        border-collapse: collapse;
        padding: 10px 20px;
    }
    .bordered-left {
        border-radius: 5px 0px 0px 5px;
    }
    .bordered-right {
        border-radius: 0px 5px 5px 0px;
    }
</style>
