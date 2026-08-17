<template>
	<VSelect
		v-model="model"
		:label
		:items
		itemValue="value"
		itemTitle="title"
		multiple
		chips
		clearable
		variant="outlined"
		density="compact"
		hideDetails
	/>
</template>

<script setup lang="ts" generic="T extends string">
	import type { ValueTitleDto } from '@/_common/dto/dto/ValueTitleDto.ts'

	defineProps<{
		label: string
		items: ValueTitleDto<T>[]
	}>()
	const model = defineModel<T[] | null>()
</script>
