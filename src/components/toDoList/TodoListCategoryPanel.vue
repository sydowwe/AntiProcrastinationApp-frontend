<template>
<div>
	<div class="d-flex align-center justify-space-between px-4 py-3">
		<span class="text-subtitle-1 font-weight-medium">{{ $t('toDoList.namedList.categories') }}</span>
		<div class="d-flex ga-1">
			<VIconBtn icon="plus" density="comfortable" color="success" variant="tonal" @click="emit('openCreate')" />
			<VIconBtn :icon="categorySortAsc ? 'sort-alpha-down' : 'sort-alpha-up'" density="comfortable" variant="tonal" @click="emit('toggleSort')" />
		</div>
	</div>
	<VDivider />
	<VList density="comfortable" style="--v-activated-opacity: 0">
		<VListItem
			class="pl-3 py-2"
			:variant="selectedCategoryId === null ? 'outlined' : 'text'"
			:style="selectedCategoryId === null ? { borderColor: 'rgb(var(--v-theme-primary))' } : {}"
			prependIcon="list"
			:title="$t('general.all')"
			rounded="lg"
			@click="emit('selectCategory', null)"
		/>
		<VListItem
			class="pr-2 pl-3 py-2"
			v-for="cat in categories"
			:key="cat.id"
			:variant="selectedCategoryId === cat.id ? 'outlined' : 'text'"
			:style="selectedCategoryId === cat.id ? { borderColor: 'rgb(var(--v-theme-primary))' } : {}"
			:prependIcon="cat.icon ?? undefined"
			:title="cat.name"
			rounded="lg"
			@click="emit('selectCategory', cat.id)"
		>
			<template v-if="cat.id !== -1" #append>
				<div class="d-flex ga-2">
					<VIconBtn icon="pen" density="comfortable" variant="tonal" color="secondaryOutline" @click.stop="emit('openEdit', cat)" />
					<VIconBtn icon="trash" density="comfortable" variant="tonal" color="default" @click.stop="emit('confirmDelete', cat)" />
				</div>
			</template>
		</VListItem>
	</VList>
</div>
</template>

<script setup lang="ts">
import {TodoListCategoryEntity} from '@/dtos/response/todoList/TodoListCategoryEntity.ts';

defineProps<{
	categories: TodoListCategoryEntity[];
	selectedCategoryId: number | null;
	categorySortAsc: boolean;
}>();

const emit = defineEmits<{
	selectCategory: [id: number | null];
	openCreate: [];
	openEdit: [cat: TodoListCategoryEntity];
	confirmDelete: [cat: TodoListCategoryEntity];
	toggleSort: [];
}>();
</script>
