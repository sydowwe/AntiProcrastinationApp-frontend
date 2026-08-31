<template>
	<div>
		<VRow
			v-show="timeInputVisible"
			class="mt-1"
		>
			<VCol
				cols="12"
				sm="6"
			>
				<div class="mb-1 d-flex ga-1 align-center">
					<VIcon
						icon="fas fa-bullseye"
						size="20"
					></VIcon>
					<h3 class="text-h6">
						{{ i18n.t('pomodoroTimer.focusActivity') }}
					</h3>
				</div>
				<ActivitySelectionForm
					v-if="!activityId"
					ref="mainActivitySelectionForm"
					v-model:activityId="focusActivityId"
					v-model:selection="focusSelection"
					:formDisabled
				></ActivitySelectionForm>
			</VCol>
			<VCol
				cols="12"
				sm="6"
			>
				<div class="mb-1 d-flex ga-1 align-center">
					<VIcon
						icon="fas fa-mug-hot"
						size="20"
					></VIcon>
					<h3 class="text-h6">
						{{ i18n.t('pomodoroTimer.restActivity') }} ({{ i18n.t('general.optional') }})
					</h3>
				</div>
				<ActivitySelectionForm
					v-model:activityId="restActivityId"
					v-model:selection="restSelection"
					:formDisabled
					mode="optional"
				></ActivitySelectionForm>
			</VCol>
		</VRow>
		<div
			v-show="!timeInputVisible"
			class="d-flex flex-wrap justify-center ga-3 mt-3"
		>
			<VChip
				color="primary"
				variant="tonal"
				size="large"
			>
				<VIcon
					icon="fas fa-bullseye"
					start
				></VIcon>
				{{ focusActivityName }}
			</VChip>
			<VChip
				v-if="restActivityName"
				color="secondary"
				variant="tonal"
				size="large"
			>
				<VIcon
					icon="fas fa-mug-hot"
					start
				></VIcon>
				{{ restActivityName }}
			</VChip>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { ref } from 'vue'
	import ActivitySelectionForm from '@/core/activity/component/ActivitySelectionForm.vue'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'

	const {
		activityId = null,
		formDisabled,
		timeInputVisible,
		focusActivityName,
		restActivityName,
	} = defineProps<{
		activityId?: number | null
		formDisabled: boolean
		timeInputVisible: boolean
		focusActivityName: string
		restActivityName: string
	}>()

	const focusActivityId = defineModel<number | null>('focusActivityId', { required: true })
	const focusSelection = defineModel<ActivitySelection | null>('focusSelection', { required: true })
	const restActivityId = defineModel<number | null>('restActivityId', { required: true })
	const restSelection = defineModel<ActivitySelection | null>('restSelection', { required: true })

	const i18n = useI18n()
	// Only the focus form is still reached into, and only for `validate()` — the rest activity is
	// optional, so there is nothing to validate on it.
	const mainActivitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>()

	defineExpose({
		validate: () => mainActivitySelectionForm.value?.validate(),
	})
</script>
