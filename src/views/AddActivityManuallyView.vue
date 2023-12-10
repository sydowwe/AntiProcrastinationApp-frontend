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
                        <TimePicker @timeChange="updateTime"></TimePicker>
                    </v-col>
                    <VCol cols="auto">
                        <VBtn @click="saveActivity()" color="success">Add activity to history</VBtn>
                    </VCol>
                </v-row>
            </v-col>
        </v-row>
    </v-container>
</template>
<script lang="js">
    import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
    import SaveActivityDialog from '../components/dialogs/SaveActivityDialog.vue';
    import TimePicker from '../components/TimePicker.vue';
    import DateTimePicker from '../components/DateTimePicker.vue';
    export default {
        components: {
            ActivitySelectionForm,
            SaveActivityDialog,
            TimePicker,
            DateTimePicker,
        },
        data() {
            return {
                formDisabled: false,
                dateTime: '',
                lengthOfActivity: {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                },
            };
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
        },
        methods: {
            saveActivity() {
                this.$refs.activitySelectionForm.addActivityToHistory(this.lengthOfActivity,this.dateTime);
            },
            updateDateTime(dateTime) {
                this.dateTime = dateTime;
            },
            updateLengthOfActivity(formattedTime){
                this.lengthOfActivity = formattedTime ?? new {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                };
            }
        },
    };
</script>
<style scoped>
    .bordered{
        border: 1px solid white;        
        border-collapse: collapse;
        padding: 10px 20px;
    }
    .bordered-left{
        border-radius: 5px 0px 0px 5px;
    }
    .bordered-right{
        border-radius: 0px 5px 5px 0px;
    }
</style>