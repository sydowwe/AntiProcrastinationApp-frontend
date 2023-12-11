<template>
    <div>
        <VRow class="my-0" align="center" justify="center">
            <VCol cols="6">
                <VTextField label="Date" v-model="dateNice"  :clearable="false" readonly hide-details>
                    <VMenu activator="parent" ref="menuRef" lazy :close-on-content-click="false" v-model="menuValue" transition="scale-transition">
                        <VDatePicker v-model:datePickerValue.sync="datePickerValue" :max="Date.now()" title="" @click:cancel="menuValue = false" @click:save="menuValue = false">
                            <template v-slot:header></template>
                        </VDatePicker>
                    </VMenu>
                </VTextField>
            </VCol>
            <VCol cols="3">
                <VTextField label="Hours" v-model="hours" type="number" min="0" max="23" :clearable="false" hide-details></VTextField>
            </VCol>
            <VCol cols="3">
                <VTextField label="Minutes" v-model="minutes" type="number" min="0" max="59" :clearable="false" hide-details></VTextField>
            </VCol>
        </VRow>
    </div>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import { VDatePicker } from 'vuetify/labs/VDatePicker';
    export default defineComponent({
        components: {
            VDatePicker,
        },
        data() {
            return {
                menuValue: false,
                datePickerValue: new Date(),
                hours: 0,
                minutes: 0,
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
        mounted() {
            const updatedDate = new Date(this.datePickerValue);
            updatedDate.setHours(this.hours);
            updatedDate.setMinutes(this.minutes);
            this.$emit('dateTimeSet', updatedDate);
        },
        watch: {
            datePickerValue(newValue) {
                const updatedDate = new Date(newValue);
                updatedDate.setHours(this.hours);
                updatedDate.setMinutes(this.minutes);
                this.$emit('dateTimeSet', updatedDate);
            },
            hours(newValue) {
                const updatedDate = this.datePickerValue;
                updatedDate.setHours(newValue);
                updatedDate.setMinutes(this.minutes);
                this.$emit('dateTimeSet', updatedDate);
            },
            minutes(newValue) {
                const updatedDate = this.datePickerValue;
                updatedDate.setHours(this.hours);
                updatedDate.setMinutes(newValue);
                this.$emit('dateTimeSet', updatedDate);
            },
        },
        emits: ['dateTimeSet'],
    });
</script>
<style></style>
