<template>
<VListItem :active="!toDoListItem.isDone" @click="itemClicked" :base-color="color" class="align-center listItem">
	<template v-slot:prepend>
		<VListItemAction start>
			<v-checkbox-btn v-model="toDoListItem.isDone" base-color="white" color="white"></v-checkbox-btn>
		</VListItemAction>
	</template>
	<VListItemTitle class="text-white">{{ toDoListItem.activity.name }}</VListItemTitle>
	<VListItemSubtitle class="text-white">{{ toDoListItem.activity.text }}</VListItemSubtitle>
	<template v-slot:append>
		<VIcon v-if="isSelected">
			<FontAwesomeIcon icon="fas fa-check-circle" class="text-info"></FontAwesomeIcon>
		</VIcon>
		<v-menu location="start" transition="slide-y-transition">
			<template v-slot:activator="{ props }">
				<v-btn icon v-bind="props" color="white" variant="text">
					<VIcon>
						<FontAwesomeIcon icon="fas fa-ellipsis-vertical"></FontAwesomeIcon>
					</VIcon>
				</v-btn>
			</template>
			<VList>
				<VListItem class="px-3" v-for="(item, i) in actions" :key="i">
					<VBtn class="px-3" :color="item.color" width="100%" @click="item.action">
						{{ actionButtonText(item.name) }}
						<VIcon class="ml-2" slot="append">
							<FontAwesomeIcon :icon="['fas', `${item.icon}`]"></FontAwesomeIcon>
						</VIcon>
					</VBtn>
				</VListItem>
			</VList>
		</v-menu>
	</template>
</VListItem>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {BaseToDoListItemEntity} from '@/classes/ToDoListItem';
import {importDefaults} from '@/compositions/Defaults';

const {i18n} = importDefaults();

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
	{name: 'select', color: 'yellow', icon: 'check-circle', action: toggleSelect},
	{name: 'edit', color: 'primary', icon: 'pen-to-square', action: edit},
	{name: 'delete', color: 'error', icon: 'trash', action: del},
];

function itemClicked() {
	props.toDoListItem.isDone = !props.toDoListItem.isDone;
}

watch(
	() => props.toDoListItem.isDone,
	(newValue) => {
		emits('isDoneChanged', props.toDoListItem);
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
