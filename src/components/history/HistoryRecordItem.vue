<template>
<div class="d-flex">
	<div class="flex-0-1 d-flex flex-column justify-space-between">
		<div class="d-flex align-center w-100">
			<VSheet class="startTime pa-1 w-100" rounded="lg" :elevation="15" color="green-darken-4">{{ formattedStartTimestamp }}</VSheet>
			<hr class="line"/>
		</div>
		<div class="d-flex justify-end w-100">
			<VSheet class="length pa-1" rounded :elevation="15" color="teal-accent-4">{{ formattedLength }}</VSheet>
		</div>
		<div class="d-flex align-center w-100">
			<VSheet class="endTime pa-1 w-100" color="indigo-darken-3" rounded="lg" :elevation="15">{{ formattedEndTimestamp }}</VSheet>
			<hr class="line"/>
		</div>
	</div>
	<VCard class="elevation-2 flex-1-0 d-flex ">
		<div class="flex-fill">
			<div class="d-flex align-start">
				<div class="flex-fill">
					<VCardTitle>{{ record.activity.name }}</VCardTitle>
					<VCardSubtitle>{{ record.activity.role?.name }}</VCardSubtitle>
				</div>
			</div>
			<VCardText>
				<div>{{ $t('activities.category') }}: {{ record.activity.category?.name }}</div>
			</VCardText>
		</div>
		<VMenu location="start" transition="slide-y-transition">
			<template #activator="{ props: menuProps }">
				<VIconBtn class="my-auto mr-2" icon="ellipsis-vertical" v-bind="menuProps" color="white" variant="text" size="40" @click.stop=""/>
			</template>
			<VList bgColor="surface" style="border: 1px solid #999">
				<VListItem v-for="(item, i) in actions" :key="i" class="px-3">
					<VBtn class="px-3" :color="item.color" :variant="item.variant" :appendIcon="item.icon" width="100%" @click="item.action">
						{{ $t(`general.${item.name}`) }}
					</VBtn>
				</VListItem>
			</VList>
		</VMenu>
	</VCard>
</div>
</template>
<script setup lang="ts">
import {computed} from 'vue';
import {ActivityHistory} from '@/dtos/response/activityHistory/ActivityHistory.ts';
import {useMoment} from '@/utils/momentHelper.ts'
import {MenuItem} from '@/dtos/dto/MenuAction.ts';

const {formatToTime} = useMoment();

const props = defineProps({
	record: {
		type: ActivityHistory,
		required: true,
	},
});

const emit = defineEmits<{ edit: [record: ActivityHistory], delete: [id: number] }>();

const actions = [
	new MenuItem('edit', 'outlined', 'primaryOutline', 'pen-to-square', () => emit('edit', props.record)),
	new MenuItem('delete', 'outlined', 'secondaryOutline', 'trash-can', () => emit('delete', props.record.id)),
];
const formattedStartTimestamp = computed(() => formatToTime(props.record.startTimestamp));
const formattedLength = computed(() => props.record.length.getNice);
const formattedEndTimestamp = computed(() => getEndOfActivityTime(props.record.startTimestamp, props.record.length.getInSeconds));

function getEndOfActivityTime(startTimestamp: Date, length: number) {
	const endInMillis = startTimestamp.valueOf() + length * 1000;
	return formatToTime(new Date(endInMillis));
}
</script>
<style scoped>
.line {
	border-width: 2px;
	min-width: 1rem !important;
}
</style>