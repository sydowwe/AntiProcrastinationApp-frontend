<template>
    <VRow class="my-0" align="center" justify="center">
        <VCol cols="6">
            <VTextField label="Date" v-model="dateNice" :clearable="false" readonly hide-details>
                <VMenu activator="parent" ref="menuRef" lazy :close-on-content-click="false" v-model="menuValue" transition="scale-transition">
                    <VDatePicker
                        v-model="dateTimeValue"
                        :ok-text="$t('general.ok')"
                        :cancel-text="$t('general.cancel')"
                        :max="Date.now()"
                        title=""
                        @click:cancel="menuValue = false"
                        @click:save="menuValue = false"
                    >
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
</template>
<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import { VDatePicker } from 'vuetify/labs/VDatePicker';

    const dateTimeValue = ref(new Date());
    const menuValue = ref(false);
    const hours = ref(0);
    const minutes = ref(0);

    const dateNice = computed(() => {
        if (dateTimeValue.value) {
            const date = new Date(dateTimeValue.value);
            return date.toLocaleDateString();
        } else {
            return null;
        }
    });  

    watch(hours, (newValue) => {
        dateTimeValue.value.setHours(newValue);
        dateTimeValue.value.setMinutes(minutes.value);
    });
    watch(minutes, (newValue) => {
        dateTimeValue.value.setHours(hours.value);
        dateTimeValue.value.setMinutes(newValue);
    });

    defineExpose({
        dateTimeValue
    }) 
</script>