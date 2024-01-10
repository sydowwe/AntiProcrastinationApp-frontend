<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
                <v-row class="mt-5" align="center" justify="center">
                    <v-col class="bordered bordered-left" cols="12" md="7">
                        <VLabel>When</VLabel>
                        <DateTimePicker @dateTimeSet="updateDateTime"></DateTimePicker>
                    </v-col>
                    <v-col class="bordered bordered-right" cols="12" md="5">
                        <VLabel>Length</VLabel>
                        <TimePicker @timeChange="updateLengthOfActivity"></TimePicker>
                    </v-col>
                    <VCol cols="auto">
                        <VBtn @click="saveActivity()" color="success">Add activity to history</VBtn>
                    </VCol>
                </v-row>
            </v-col>
        </v-row>
    </v-container>
</template>
<script lang="ts">
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import SaveActivityDialog from '../components/dialogs/SaveActivityDialog.vue';
    import TimePicker from '../components/TimePicker.vue';
    import DateTimePicker from '../components/DateTimePicker.vue';
    import { TimeObject } from '../classes/TimeUtils';
    import { ActivitySelectionFormType } from '../classes/RefTypeInterfaces';
    import { defineComponent, ref } from 'vue';
    export default defineComponent({
        setup() {
            const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
            return { activitySelectionForm };
        },
        components: {
            ActivitySelectionForm,
            SaveActivityDialog,
            TimePicker,
            DateTimePicker,
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
                        alert("length not set")
                        //TODO warn length not set
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
