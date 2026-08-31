<template>
	<VCard
		:class="mobile ? undefined : 'py-0'"
		:rounded="mobile ? '0' : undefined"
		height="100%"
		style="overflow: hidden"
	>
		<TodoListCategoryPanel
			v-model:hideEmpty="hideEmptyCategories"
			v-model:filterName="categoryFilterName"
			:categories
			:selectedCategoryId
			:categorySortAsc
			@selectCategory="emit('selectCategory', $event)"
			@openCreate="emit('openCreate')"
			@openEdit="emit('openEdit', $event)"
			@confirmDelete="emit('confirmDelete', $event)"
			@toggleSort="emit('toggleSort')"
			@closeDialog="emit('closeDialog')"
		/>
	</VCard>
</template>

<script setup lang="ts">
	import TodoListCategoryPanel from '@/core/todoList/component/normal/TodoListCategoryPanel.vue'
	import type { TodoListCategoryEntity } from '@/core/todoList/dto/response/TodoListCategoryEntity.ts'

	const { mobile = false } = defineProps<{
		categories: TodoListCategoryEntity[]
		selectedCategoryId: number | null
		categorySortAsc: boolean
		mobile?: boolean
	}>()

	const emit = defineEmits<{
		selectCategory: [id: number | null]
		closeDialog: []
		openCreate: []
		openEdit: [cat: TodoListCategoryEntity]
		confirmDelete: [cat: TodoListCategoryEntity]
		toggleSort: []
	}>()

	const hideEmptyCategories = defineModel<boolean>('hideEmpty', { default: false })
	const categoryFilterName = defineModel<string | null>('filterName', { default: null })
</script>
