<template>
	<VCard
		elevation="2"
		color="surface"
		:class="`pa-4 d-flex flex-column ga-${ga}`"
	>
		<h3>{{ title }}</h3>
		<slot></slot>
	</VCard>
</template>
<script setup lang="ts">
	const { title, ga = 3 } = defineProps<{
		title: string
		ga?: number
	}>()
</script>
