<template>
<VListItem :active="!toDoListItem.isDone" @click="itemClicked" :base-color="color" class="align-center listItem">
	<template v-slot:prepend>
		<VListItemAction start>
			<v-checkbox-btn v-if="!toDoListItem.isMultipleCount" v-model="toDoListItem.isDone" base-color="white" color="success"></v-checkbox-btn>
			<div v-else class="d-flex flex-column ga-1 align-center justify-center">
				<VHover>
					<template v-slot:default="{ isHovering, props }">
						<VIconBtn v-bind="props" v-if="isHovering" icon="minus" color="white" variant="tonal" width="40" height="35" @click.stop="">
							<VIcon size="22"></VIcon>
						</VIconBtn>
						<span v-else
						      v-bind="props" style="width: 40px" @click.stop="">
							<VProgressLinear
								color="neutral-400"
								:model-value="(toDoListItem.doneCount ?? 1) / (toDoListItem.totalCount ?? 1) * 100"
								height="35"
								bgOpacity="0.3"
								style="border: 1px solid #777; border-radius: 4px;"
							>
								<div class="d-flex align-center">
									<span v-if="!toDoListItem.isDone && toDoListItem.doneCount !== null" class="text-white">{{ toDoListItem.doneCount }}</span>
									<VIcon v-if="toDoListItem.isDone" size="17" icon="check" color="success"></VIcon>
									<span class="text-white">/{{ toDoListItem.totalCount}}</span>
								</div>
						</VProgressLinear>
						</span>

					</template>
				</VHover>
			</div>
		</VListItemAction>
	</template>
	<VListItemTitle class="text-white">{{ toDoListItem.activity.name }}</VListItemTitle>
	<VListItemSubtitle class="text-white">{{ toDoListItem.activity.text }}</VListItemSubtitle>
	<template v-slot:append>
		<VIcon v-if="isSelected" icon="check-circle" color="#fff">
		</VIcon>
		<v-menu location="start" transition="slide-y-transition">
			<template v-slot:activator="{ props }">
				<v-btn icon="ellipsis-vertical" v-bind="props" color="white" variant="text"></v-btn>
			</template>
			<VList>
				<VListItem class="px-3" v-for="(item, i) in actions" :key="i">
					<VBtn class="px-3" :color="item.color" :variant="item.variant" :append-icon="item.icon" width="100%" @click="item.action">
						{{ actionButtonText(item.name) }}
					</VBtn>
				</VListItem>
			</VList>
		</v-menu>
	</template>
</VListItem>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {type BaseToDoListItemEntity} from '@/classes/ToDoListItem';
import {useI18n} from 'vue-i18n';

const i18n = useI18n();

const props = defineProps({
	toDoListItem: {
		type: Object as () => BaseToDoListItemEntity,
		required: true,
	},
	color: {
		type: String,
		required: true,
	},
});
const emits = defineEmits<{
	edit: [toDoListItem: BaseToDoListItemEntity];
	delete: [id: number];
	select: [id: number];
	unSelect: [id: number];
	isDoneChanged: [toDoListItem: BaseToDoListItemEntity];
}>();

const isSelected = ref(false);

const actions = [
	{name: 'select', variant: 'tonal', color: 'primaryOutline', icon: 'check-circle', action: toggleSelect},
	{name: 'edit', variant: 'outlined', color: 'primaryOutline', icon: 'pen-to-square', action: edit},
	{name: 'delete', variant: 'outlined', color: 'secondaryOutline', icon: 'trash', action: del},
];

function itemClicked() {
	props.toDoListItem.isDone = !props.toDoListItem.isDone;
	emits('isDoneChanged', props.toDoListItem);
}

watch(
	() => props.toDoListItem.isDone,
	(newValue) => {
		isSelected.value = false;
	}
);

function actionButtonText(name: string) {
	return i18n.t(isSelected.value && name === 'select' ? `general.un${name}` : `general.${name}`);
}

function edit() {
	emits('edit', props.toDoListItem);
	isSelected.value = false;
}

function del() {
	emits('delete', props.toDoListItem.id);
	isSelected.value = false;
}

function toggleSelect() {
	isSelected.value = !isSelected.value;
	if (isSelected.value) {
		emits('select', props.toDoListItem.id);
	} else {
		emits('unSelect', props.toDoListItem.id);
	}
}
</script>
<style scoped>
.listItem {
	border: 2px solid black !important;
	border-radius: 5px;
}
</style>
