<template>
	<div class="d-flex flex-column ga-3">
		<span class="text-body-2">{{ t('activities.merge.explanation') }}</span>
		<!--
			The predicted record count below is an upper bound: the server collapses two references from one
			row into a single one, so `repointedCount` can land under it. Without saying so, a snackbar
			reporting a smaller number than the confirmation reads as the merge having gone wrong.
		-->
		<span class="text-caption text-textMuted">{{ t('activities.merge.collapseNote') }}</span>

		<VRadioGroup
			v-model="survivorId"
			hideDetails
			class="merge-survivor-group"
		>
			<VRadio
				v-for="activity in activities"
				:key="activity.id"
				:value="activity.id"
				color="primaryOutline"
			>
				<template #label>
					<div class="d-flex flex-column py-1">
						<span class="text-body-1">{{ activity.name }}</span>
						<span class="text-caption text-textMuted">{{ subtitle(activity) }}</span>
					</div>
				</template>
			</VRadio>
		</VRadioGroup>

		<SubtleCard
			v-if="survivor"
			color="warning"
			icon="triangle-exclamation"
			:text="`${outcomeText} ${t('activities.merge.irreversible')}`"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { useDialog, useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { MergeActivitiesRequest } from '@/core/activity/dto/request/MergeActivitiesRequest.ts'
	import type { Activity } from '@/core/activity/dto/response/Activity.ts'

	/**
	 * Pick which of the selected activities survives; everything referencing the others repoints to it
	 * and they are deleted.
	 *
	 * The survivor choice is the whole decision, so the list shows what the user needs to make it — the
	 * role and category each activity carries, and how many rows point at it. The default is the
	 * most-referenced one, which is the answer nearly every time: merging the big one into the typo
	 * moves the most rows and leaves the wrong name behind.
	 */
	const { activities } = defineProps<{ activities: Activity[] }>()

	const { t } = useI18n()
	const { confirm } = useDialog()
	const { showSuccessSnackbar } = useSnackbar()
	const { merge } = useActivityCrud()
	const dialogApi = useDialogApi<boolean>()

	const survivorId = ref<number | null>(defaultSurvivorId())

	const survivor = computed(() => activities.find(activity => activity.id === survivorId.value) ?? null)
	const mergedAway = computed(() => activities.filter(activity => activity.id !== survivorId.value))
	const recordsMoved = computed(() => mergedAway.value.reduce((total, activity) => total + activity.usageCount, 0))

	/**
	 * What the merge will do, in the numbers the user can see in the table. Repeated verbatim in the
	 * final confirmation — the point of showing it here is that the confirmation is not the first time
	 * the user reads it.
	 */
	const outcomeText = computed(() =>
		t('activities.merge.outcome', {
			survivor: survivor.value?.name ?? '',
			activities: t(
				'activities.merge.activityCount',
				{ count: mergedAway.value.length },
				mergedAway.value.length,
			),
			records: t('activities.merge.recordCount', { count: recordsMoved.value }, recordsMoved.value),
		}),
	)

	dialogApi.onConfirm(onConfirm)

	function defaultSurvivorId(): number | null {
		if (activities.length === 0) return null
		return activities.reduce((best, activity) => (activity.usageCount > best.usageCount ? activity : best)).id
	}

	function subtitle(activity: Activity): string {
		const placement = [activity.role?.name, activity.category?.name].filter(Boolean).join(' · ') || '—'
		return `${placement} — ${t('activities.archive.usageCount')}: ${activity.usageCount}`
	}

	async function onConfirm() {
		// Nothing to fold in: a one-activity merge is refused server-side too, and the merge button that
		// opens this dialog is disabled below two. This only catches a survivor that never got picked.
		if (survivorId.value == null || mergedAway.value.length === 0) return

		// Irreversible and it moves rows in four other modules, so this confirmation is unconditional —
		// `askBeforeDelete` gets no vote here. Nothing retains the pre-merge mapping, so there is no undo
		// to fall back on and no cheaper safeguard available.
		const confirmed = await confirm({
			title: t('activities.merge.confirmTitle'),
			text: `${outcomeText.value} ${t('activities.merge.irreversible')}`,
			confirmBtnLabel: t('activities.merge.action'),
			confirmBtnColor: 'error',
		})
		if (!confirmed) return

		dialogApi.setLoading(true)
		try {
			const result = await merge(
				new MergeActivitiesRequest(
					survivorId.value,
					mergedAway.value.map(activity => activity.id),
				),
			)
			showSuccessSnackbar(
				t('activities.merge.success', {
					survivor: survivor.value?.name ?? '',
					activities: t('activities.merge.activityCount', { count: result.mergedCount }, result.mergedCount),
					records: t('activities.merge.recordCount', { count: result.repointedCount }, result.repointedCount),
				}),
			)
			dialogApi.close(true)
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>

<style scoped>
	/* One radio per row, with room for the two-line label. */
	.merge-survivor-group :deep(.v-selection-control) {
		align-items: flex-start;
	}
</style>
