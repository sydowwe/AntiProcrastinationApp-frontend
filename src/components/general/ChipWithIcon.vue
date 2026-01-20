<template>
<VChip
	:size="size ?? 'x-small'"
	:variant="variant ?? 'flat'"
	:color="color ?? 'white'"
>
	<VIcon v-if="icon" :icon="icon" style="margin-right: 6px;"/>
	<slot></slot>
</VChip>
</template>

<script setup lang="ts">
defineProps<{
	icon?: string,
	color?: string,
	size?: string,
	variant?: "text" | "flat" | "elevated" | "outlined" | "plain" | "tonal",
}>()
</script>

<style scoped>

</style>