<template>
	<MyDialog
		v-model="entry.open"
		v-bind="entry.dialogProps"
		@confirmed="onConfirmed"
		@closed="onClosed"
	>
		<component
			:is="entry.component"
			v-if="entry.component"
			v-bind="entry.componentProps"
		/>
	</MyDialog>
</template>

<script setup lang="ts">
	import { provide, watch } from 'vue'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import {
		DIALOG_API_KEY,
		useDialog,
		type DialogApi,
		type DialogEntry,
		type DialogProps,
	} from '@/composables/general/useDialog.ts'

	const { entry } = defineProps<{ entry: DialogEntry }>()
	const { _settleEntry } = useDialog()

	const api: DialogApi = {
		close(result: unknown = null) {
			_settleEntry(entry, result)
		},
		onConfirm(handler) {
			entry.confirmHandler = handler
		},
		setLoading(loading: boolean) {
			entry.dialogProps.loading = loading
		},
		setDialogProps(patch: Partial<DialogProps>) {
			Object.assign(entry.dialogProps, patch)
		},
	}

	provide(DIALOG_API_KEY, api)

	async function onConfirmed() {
		if (entry.confirmHandler) {
			await entry.confirmHandler()
		} else {
			api.close(true)
		}
	}

	function onClosed() {
		api.close(null)
	}

	watch(
		() => entry.open,
		open => {
			if (!open && !entry.resolved) {
				api.close(null)
			}
		},
	)
</script>
