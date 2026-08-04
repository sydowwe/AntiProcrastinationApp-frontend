<template>
	<MyDialog
		v-model="open"
		:title="$t('reminders.cancel.title')"
		:confirmBtnLabel="$t('reminders.cancel.confirm')"
		confirmBtnColor="errorDark"
		:confirmBtnDisabled="loading"
		@confirmed="emit('confirmed')"
	>
		<div class="d-flex flex-column ga-4 py-2">
			<VAlert
				type="error"
				variant="tonal"
				:title="$t('reminders.cancel.warningTitle')"
				:text="$t('reminders.cancel.warningText')"
			/>

			<div v-if="reminderKey !== null">
				<InfoRow
					:label="$t('reminders.key.kind')"
					:value="reminderKey"
				/>
			</div>
		</div>
	</MyDialog>
</template>

<script setup lang="ts">
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import InfoRow from '@/_common/component/feedback/InfoRow.vue'

	const { reminderKey = null, loading = false } = defineProps<{
		reminderKey?: string | null
		loading?: boolean
	}>()

	const emit = defineEmits<{ confirmed: [] }>()

	const open = defineModel<boolean>({ required: true })
</script>
