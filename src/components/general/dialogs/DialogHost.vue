<template>
	<DialogEntryRenderer
		v-for="entry in stack"
		:key="entry.id"
		:entry
	/>
</template>

<script setup lang="ts">
	import DialogEntryRenderer from '@/components/general/dialogs/DialogEntryRenderer.vue'
	import { useDialog } from '@/composables/general/useDialog.ts'

	const { _stack: stack } = useDialog()
</script>
