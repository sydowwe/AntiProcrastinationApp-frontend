<template>
<VListItem :active="!alarm.isActive" @click="itemClicked" :base-color="alarm.activity.category?.color as string | undefined" class="listItem pa-0">
	<template v-slot:prepend="{ isActive }">
		<VListItemAction @click="alarm.isActive = isActive" class="py-2 pl-5 pr-2">
			<VSwitch :model-value="isActive" color="info" hide-details></VSwitch>
		</VListItemAction>
		<div class="text-white">{{ timeLabel }}</div>
	</template>
	<VListItemTitle class="text-white">{{ alarm.activity.name }}</VListItemTitle>
	<VListItemSubtitle class="text-white">{{ alarm.activity.text }}</VListItemSubtitle>
	<template v-slot:append class="align-center">
		<VIcon icon="check-circle" v-if="isSelected">
		</VIcon>
		<v-menu location="start" transition="slide-y-transition">
			<template v-slot:activator="{ props }">
				<v-btn icon v-bind="props" color="white" variant="text" class="py-2 px-4">
					<VIcon icon="ellipsis-vertical">
					</VIcon>
				</v-btn>
			</template>
			<VList>
				<VListItem class="px-3" v-for="(item, i) in actions" :key="i">
					<VBtn class="px-3" :color="item.color" width="100%" @click="item.action">
						{{ actionButtonText(item.name) }}
						<VIcon :icon="item.icon" class="ml-2" slot="append">
						</VIcon>
					</VBtn>
				</VListItem>
			</VList>
		</v-menu>
	</template>
</VListItem>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {Alarm} from '@/dtos/response/Alarm.ts';
import {useMoment} from '@/scripts/momentHelper.ts';

const {formatDateLocalized, formatToTime} = useMoment();

const i18n = useI18n();

const props = defineProps({
	alarm: {
		type: Alarm,
		required: true,
	},
});
const emits = defineEmits<{
	edit: [alarm: Alarm];
	delete: [id: number];
	select: [id: number];
	unSelect: [id: number];
	itemClicked: [alarm: Alarm];
}>();

const isSelected = ref(false);

const actions = [
	{name: 'select', color: 'yellow', icon: 'check-circle', action: toggleSelect},
	{name: 'edit', color: 'primary', icon: 'pen-to-square', action: edit},
	{name: 'delete', color: 'error', icon: 'trash', action: del},
];

function itemClicked() {
	emits('itemClicked', props.alarm);
}

const timeLabel = computed(() => {
	return `${props.alarm?.startTimestamp === new Date() ? '' : formatDateLocalized(props.alarm?.startTimestamp)} - ${formatToTime(props.alarm?.startTimestamp)}`;
})

watch(
	() => props.alarm.isActive,
	() => {
		isSelected.value = false;
	}
);

function actionButtonText(name: string) {
	return i18n.t(isSelected.value && name === 'select' ? `general.un${name}` : `general.${name}`);
}

function edit() {
	emits('edit', props.alarm);
	isSelected.value = false;
}

function del() {
	emits('delete', props.alarm.id);
	isSelected.value = false;
}

function toggleSelect() {
	isSelected.value = !isSelected.value;
	if (isSelected.value) {
		emits('select', props.alarm.id);
	} else {
		emits('unSelect', props.alarm.id);
	}
}
</script>
<style scoped>
.listItem {
	border: 2px solid black !important;
	border-radius: 5px;
}
</style>