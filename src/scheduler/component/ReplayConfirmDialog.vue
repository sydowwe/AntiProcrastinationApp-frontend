<template>
	<MyDialog
		v-model="open"
		:title="$t('scheduler.replay.title')"
		:confirmBtnLabel="$t('scheduler.replay.confirm')"
		confirmBtnColor="warningDark"
		:confirmBtnDisabled="!acknowledged || loading"
		@confirmed="emit('confirmed')"
		@closed="acknowledged = false"
	>
		<div class="d-flex flex-column ga-4 py-2">
			<VAlert
				type="warning"
				variant="tonal"
				:title="$t('scheduler.replay.warningTitle')"
				:text="$t('scheduler.replay.warningText')"
			/>

			<div v-if="runId !== null">
				<InfoRow
					:label="$t('scheduler.run.jobKey')"
					:value="jobKey ?? ''"
				/>
				<InfoRow
					class="mt-2"
					:label="$t('scheduler.replay.replayingRun')"
					:value="`#${runId}`"
				/>
			</div>

			<VCheckbox
				v-model="acknowledged"
				:label="$t('scheduler.replay.acknowledge')"
				hideDetails
				color="warningDark"
			/>
		</div>
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import InfoRow from '@/_common/component/feedback/InfoRow.vue'

	const {
		runId,
		jobKey = null,
		loading = false,
	} = defineProps<{
		runId: number | null
		jobKey?: string | null
		loading?: boolean
	}>()

	const emit = defineEmits<{ confirmed: [] }>()

	const open = defineModel<boolean>({ required: true })
	const acknowledged = ref(false)
</script>
