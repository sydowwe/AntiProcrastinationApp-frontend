<template>
	<VCombobox
		v-model="items"
		:label
		multiple
		chips
		closableChips
		clearable
		variant="outlined"
		density="comfortable"
		hideDetails
	/>
</template>

<script setup lang="ts">
	const { label = '' } = defineProps<{ label?: string }>()
	const items = defineModel<string[]>({ required: true })
</script>
