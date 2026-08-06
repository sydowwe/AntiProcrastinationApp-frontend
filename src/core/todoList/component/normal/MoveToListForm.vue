<template>
	<VIdSelect
		v-model="selectedListId"
		:items="listOptions"
		:label="$t('toDoList.destinationList')"
	/>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { useTodoListCrud } from '@/core/todoList/api/todoListApi.ts'
	import { useDialogApi } from '@/composables/general/useDialog.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

	const { currentListId } = defineProps<{ currentListId: number }>()

	const dialogApi = useDialogApi<{ destinationListId: number }>()

	const { fetchSelectOptions } = useTodoListCrud()

	const selectedListId = ref<number | null>(null)
	const listOptions = ref<SelectOption[]>([])

	dialogApi.onConfirm(onConfirm)

	onMounted(async () => {
		dialogApi.setLoading(true)
		const allOptions = await fetchSelectOptions()
		listOptions.value = allOptions.filter(o => o.id !== currentListId)
		dialogApi.setLoading(false)
	})

	function onConfirm() {
		if (!selectedListId.value) return
		dialogApi.close({ destinationListId: selectedListId.value })
	}
</script>
