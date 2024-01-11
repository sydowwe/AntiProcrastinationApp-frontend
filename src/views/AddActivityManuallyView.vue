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
                    <VBtn @click="saveActivity()" color="success">{{ $t("history.addActivityToHistory") }}</VBtn>
                </VCol>
            </VRow>
        </VCol>
    </VRow>
    <ErrorSnackBar ref="errorSnackBar"></ErrorSnackBar>
</template>
<script lang="ts">
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import SaveActivityDialog from '../components/dialogs/SaveActivityDialog.vue';
    import TimePicker from '../components/TimePicker.vue';
    import DateTimePicker from '../components/DateTimePicker.vue';
    import { TimeObject } from '../classes/TimeUtils';
    import { ActivitySelectionFormType, FeedBackType } from '../classes/types/RefTypeInterfaces';
    import { defineComponent, ref } from 'vue';
import ErrorSnackBar from '../components/feedback/ErrorSnackBar.vue';
    export default defineComponent({
        setup() {
            const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
            const errorSnackBar = ref<FeedBackType>({} as FeedBackType);
            return { activitySelectionForm, errorSnackBar };
        },
        components: {
            ActivitySelectionForm,
            SaveActivityDialog,
            TimePicker,
            DateTimePicker,
            ErrorSnackBar
        },
        data() {
            return {
                formDisabled: false,
                dateTime: new Date(),
                lengthOfActivity: new TimeObject(),
            };
        },
        methods: {
            saveActivity() {
                if (this.dateTime.valueOf() <= Date.now()) {
                    if (this.lengthOfActivity.isNotZero()) {
                        this.activitySelectionForm?.addActivityToHistory(this.lengthOfActivity, this.dateTime.valueOf());
                    } else {
                        this.errorSnackBar.show(this.$t("history.lengthNotSet"));
                    }
                } else {
                    //TODO Really wanna add activity in future
                }
            },
            updateDateTime(dateTime: Date) {
                this.dateTime = dateTime;
            },
            updateLengthOfActivity(formattedTime: TimeObject | undefined) {
                this.lengthOfActivity = formattedTime ?? new TimeObject(0, 0, 0);
            },
        },
    });
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
../classes/types/RefTypeInterfaces