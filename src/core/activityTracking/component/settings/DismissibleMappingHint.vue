<template>
	<VAlert
		v-if="!dismissed"
		type="info"
		variant="tonal"
		closable
		@click:close="dismiss"
	>
		Use the filter fields to define a matching pattern, then choose an activity or mark as ignored and click
		<strong>Save</strong>
		. The filter becomes the rule — future entries matching it will be mapped automatically. To edit an existing
		rule, open the
		<strong>Mappings</strong>
		tab and click edit.
	</VAlert>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { readUserScoped, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

	const { storageKey } = defineProps<{ storageKey: string }>()

	// Device-local ON PURPOSE. Triaged in P4 and deliberately left here: a hint you already dismissed
	// reappearing once on a new device costs two seconds, which does not buy an endpoint. Scoped by
	// user only so a second account on the same browser gets the hint it has never seen.
	const dismissed = ref(readUserScoped(storageKey) === 'true')

	function dismiss() {
		dismissed.value = true
		writeUserScoped(storageKey, 'true')
	}
</script>
