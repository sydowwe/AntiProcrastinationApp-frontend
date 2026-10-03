<template>
	<!-- `flex-grow-0`: VAlert ships `flex: 1 1`, and the view is a flex column. -->
	<VAlert
		v-if="!dismissed"
		class="flex-grow-0"
		type="info"
		variant="tonal"
		density="compact"
		icon="fas fa-cloud-sun"
		closable
		@click:close="dismiss"
	>
		<div class="d-flex flex-wrap align-center ga-2">
			<span>{{ $t('leisure.picker.weatherLocationHint') }}</span>
			<!-- By route name only — `userSettings` belongs to `core/user`, and a name crosses no module boundary. -->
			<VBtn
				class="text-none"
				variant="text"
				color="primaryOutline"
				size="small"
				:to="{ name: 'userSettings' }"
			>
				{{ $t('leisure.picker.setWeatherLocation') }}
			</VBtn>
		</div>
	</VAlert>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { readUserScoped, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

	const STORAGE_KEY = 'leisure.weatherLocationHintDismissed'

	// Device-local, like the tracking settings hints: the location is optional, and a user who has
	// said no once should not be asked on every draw. Reappearing once on a new device costs nothing
	// worth an endpoint.
	const dismissed = ref(readUserScoped(STORAGE_KEY) === 'true')

	function dismiss() {
		dismissed.value = true
		writeUserScoped(STORAGE_KEY, 'true')
	}
</script>
