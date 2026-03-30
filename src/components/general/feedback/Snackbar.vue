<template>
	<VSnackbar
		v-model="snackbar"
		class="mt-16"
		:timeout
		:color
		location="top"
	>
		{{ message }}
		<template
			v-if="closable || actionLabel"
			#actions
		>
			<VBtn
				v-if="actionLabel"
				color="white"
				variant="text"
				@click="handleAction"
			>
				{{ actionLabel }}
			</VBtn>
			<VBtn
				v-if="closable"
				color="white"
				variant="text"
				@click="hideSnackbar"
			>
				{{ $t('general.close') }}
			</VBtn>
		</template>
	</VSnackbar>
</template>
<script setup lang="ts">
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'

	const { snackbar, color, message, timeout, closable, actionLabel, actionCallback, hideSnackbar } = useSnackbar()

	function handleAction() {
		actionCallback.value?.()
		hideSnackbar()
	}
</script>
