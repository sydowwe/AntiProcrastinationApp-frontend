<template>
	<MyDialog
		v-model="isOpen"
		:title="$t('toDoList.moveToList')"
		@confirmed="confirm"
	>
		<VIdSelect
			v-model="selectedListId"
			:items="listOptions"
			:label="$t('toDoList.destinationList')"
		/>
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import { useTodoListCrud } from '@/api/todoList/todoListApi.ts'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'

	const { currentListId } = defineProps<{ currentListId: number }>()
	const emit = defineEmits<{ moved: [itemId: number, destinationListId: number] }>()

	const { fetchSelectOptions } = useTodoListCrud()

	const isOpen = ref(false)
	const selectedListId = ref<number | null>(null)
	const listOptions = ref<SelectOption[]>([])
	let pendingItemId: number | null = null

	async function open(itemId: number) {
		pendingItemId = itemId
		selectedListId.value = null
		const allOptions = await fetchSelectOptions()
		listOptions.value = allOptions.filter(o => o.id !== currentListId)
		isOpen.value = true
	}

	function confirm() {
		if (!selectedListId.value || pendingItemId === null) return
		emit('moved', pendingItemId, selectedListId.value)
		isOpen.value = false
	}

	defineExpose({ open })
</script>
