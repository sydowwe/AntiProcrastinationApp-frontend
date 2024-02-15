<template>
    <VRow justify="center" class="mt-md-1">
        <VCol cols="12" lg="3" class="mt-2 pb-2 mt-md-0 pb-md-0">
            <VSelect label="Timespan" v-model="selectedTimeSpan" :items="nOHours" hideDetails></VSelect>
        </VCol>
        <VCol cols="12" lg="3">
            <VSelect label="Minute interval" v-model="selectedMinuteInterval" :items="minuteIntervals" hideDetails></VSelect>
        </VCol>
        <VCol cols="12" lg="3" alignSelf="center">
            <VBtn @click="plannerDialog.open" color="success">{{ $t('general.add') }}</VBtn>
        </VCol>
    </VRow>
    <div class="d-flex flex-column mt-5 mt-md-7 table">
        <div class="w-100 d-flex" v-for="(hour, index) in hourLabels" :key="index">
            <div class="flex-shrink-1 cell">{{ hour }}</div>
            <VSheet class="flex-grow-1 cell task" :id="index" @click=""></VSheet>
        </div>
    </div>
    <PlannerDialog ref="plannerDialog" :intervals="intervals" @saved="saved"></PlannerDialog>
</template>
<script setup lang="ts">
        import PlannerDialog from '../components/dialogs/PlannerDialog.vue';
        import { ref, computed, reactive, } from 'vue';
        import { IdLabelOption } from '../classes/IdLabelOption';
    import { DialogType } from '../classes/types/RefTypeInterfaces';
        const plannerDialog = ref<DialogType>({} as DialogType);

        const nOHours = [6, 12, 24];
        const minuteIntervals = [60, 45, 30, 15, 10];
        const selectedTimeSpan = ref(nOHours[0]);
        const selectedMinuteInterval = ref(minuteIntervals[0]);
        const intervals = reactive([] as IdLabelOption[]);

        const hourLabels = computed(() => {
            const array = [] as string[];
            const currentHour = new Date().getHours();
            intervals.length = 0;
            for (let index = 0; index < selectedTimeSpan.value; index++) {
                const startHour = currentHour + index;
                let endHour = startHour;
                for (let minute = 0; minute < 60; minute += selectedMinuteInterval.value) {
                    const startMinute = minute < 10 ? `0${minute}` : `${minute}`;
                    let endMinute = minute + selectedMinuteInterval.value;
                    if (endMinute >= 60) {
                        endMinute -= 60;
                        endHour++;
                    }
                    const endMinuteStr = endMinute < 10 ? `0${endMinute}` : `${endMinute}`;
                    array.push(`${startHour}:${startMinute} - ${endHour}:${endMinuteStr}`);
                    intervals.push(new IdLabelOption(index, `${startHour}:${startMinute} - ${endHour}:${endMinuteStr}`));
                }
            }
            return array;
        });
        function saved(task: string, color: string) {}
</script>
<style scoped>
    .table {
        border-collapse: collapse;
        user-select: none;
        border: 1px solid white;
    }
    .cell {
        padding: 2px 6px;
        border: 1px solid white;
    }
    .task {
        cursor: pointer;
    }
    @media (min-width: 992px) {
        .table {
            font-size: x-large;
        }
        .cell {
            padding: 5px 10px;
        }
    }
</style>
