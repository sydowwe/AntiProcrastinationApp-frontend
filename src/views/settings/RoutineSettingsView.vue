<template>
<div class="h-100 w-100 d-flex flex-column ga-4 pa-4">
	<div class="d-flex align-center ga-3">
		<h2>Time Periods</h2>
		<VBtn color="primary" prependIcon="plus" @click="timePeriodDialog?.openAddDialog()">Add</VBtn>
	</div>
	<VList lines="two" class="rounded-lg" color="surface">
		<VListItem
			v-for="period in timePeriods"
			:key="period.id"
			:title="period.text ?? ''"
			:subtitle="`${period.lengthInDays} days`"
		>
			<template v-slot:prepend>
				<VSheet v-if="period.color" :style="{ backgroundColor: getBgColor(period.color) }" width="16" height="16" rounded="circle" class="mr-3"/>
				<VIcon v-else icon="clock" class="mr-3"/>
			</template>
			<template v-slot:append>
				<div class="d-flex ga-2">
					<VIconBtn icon="pen" density="comfortable" variant="tonal" color="secondaryOutline" :title="$t('general.edit')"
					          @click="timePeriodDialog?.openEditDialog(period)">
					</VIconBtn>
					<VIconBtn icon="trash" density="comfortable" variant="tonal" color="error" :title="$t('general.delete')"
					          @click="onDelete(period.id)">
					</VIconBtn>
				</div>
			</template>
		</VListItem>
		<VListItem v-if="timePeriods.length === 0" title="No time periods yet" class="text-disabled"/>
	</VList>
</div>
<TimePeriodDialog ref="timePeriodDialog" @created="onCreated" @updated="onUpdated"></TimePeriodDialog>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import TimePeriodDialog from '@/components/dialogs/timePeriod/TimePeriodDialog.vue';
import {TimePeriodEntity} from '@/dtos/response/activityRecording/TimePeriodEntity.ts';
import {TimePeriodRequest} from '@/dtos/request/activityRecording/TimePeriodRequest.ts';
import {useRoutineTimePeriodCrud} from '@/api/routineTodoList/timePeriodApi.ts';
import {useColor} from '@/utils/colorPalette.ts';

const {fetchAll, deleteEntity} = useRoutineTimePeriodCrud();
const {getBgColor} = useColor()

const timePeriods = ref<TimePeriodEntity[]>([]);
const timePeriodDialog = ref<InstanceType<typeof TimePeriodDialog>>();

onMounted(async () => {
	timePeriods.value = await fetchAll();
});

function onCreated(created: TimePeriodEntity) {
	timePeriods.value.push(created);
}

function onUpdated(updatedId: number, updatedRequest: TimePeriodRequest) {
	const index = timePeriods.value.findIndex(p => p.id === updatedId);
	if (index !== -1) {
		timePeriods.value[index] = {...timePeriods.value[index], ...updatedRequest};
	}
}

async function onDelete(id: number) {
	await deleteEntity(id);
	timePeriods.value = timePeriods.value.filter(p => p.id !== id);
}
</script>
