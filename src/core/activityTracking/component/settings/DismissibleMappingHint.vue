<template>
	<VAlert
		v-if="!dismissed"
		type="info"
		variant="tonal"
		closable
		@click:close="dismiss"
	>
		<i18n-t
			keypath="activityTracking.settings.hintText"
			tag="span"
			scope="global"
		>
			<template #save>
				<strong>{{ $t('general.save') }}</strong>
			</template>
			<template #mappingsTab>
				<strong>{{ $t('activityTracking.settings.mappings') }}</strong>
			</template>
		</i18n-t>
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
