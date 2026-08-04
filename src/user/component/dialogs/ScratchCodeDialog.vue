<template>
	<MyDialog
		v-model="dialog"
		:title="i18n.t('user.newScratchCodes')"
		:confirmBtnLabel="i18n.t('general.done')"
		:hasCloseBtn="false"
		@confirmed="done"
	>
		<div class="d-flex flex-column ga-3 align-center">
			<VAlert
				type="warning"
				variant="tonal"
				density="comfortable"
				class="w-100"
			>
				{{ i18n.t('user.scratchCodeNotice') }}
			</VAlert>
			<div class="d-flex flex-column ga-1 align-center">
				<code
					v-for="code in codes"
					:key="code"
					class="text-h6"
				>
					{{ code }}
				</code>
			</div>
		</div>
	</MyDialog>
</template>
<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'

	const { scratchCode } = defineProps<{
		scratchCode: string | string[]
	}>()
	const emit = defineEmits<{
		done: []
	}>()
	const dialog = defineModel<boolean>({ required: true })
	const i18n = useI18n()

	const codes = computed(() => (Array.isArray(scratchCode) ? scratchCode : [scratchCode]).filter(Boolean))

	function done() {
		emit('done')
		dialog.value = false
	}
</script>
