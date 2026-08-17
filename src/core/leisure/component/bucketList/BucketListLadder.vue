<template>
	<div class="h-100 w-100 d-flex flex-column ga-3">
		<VProgressLinear
			v-if="loading"
			indeterminate
		/>
		<template v-if="!loading && isEmpty">
			<div class="empty-state">
				<VIcon
					icon="star"
					size="40"
					class="mb-3"
					style="opacity: 0.3"
				/>
				<p class="text-subtitle-2 font-weight-medium mb-3">{{ $t('leisure.emptyStates.bucketList') }}</p>
				<VBtn
					color="success"
					variant="tonal"
					prependIcon="plus"
					@click="openCreateDialog"
				>
					{{ $t('general.add') }}
				</VBtn>
			</div>
		</template>
		<template v-else>
			<div class="d-flex justify-end">
				<VBtn
					color="success"
					variant="tonal"
					prependIcon="plus"
					size="small"
					@click="openCreateDialog"
				>
					{{ $t('general.add') }}
				</VBtn>
			</div>
			<VCard
				v-if="nudgeItem"
				variant="tonal"
				:color="comfortZoneColor(nudgeItem.comfortZoneStep)"
				class="nudge-card"
				@click="onEdit(nudgeItem)"
			>
				<VCardText class="d-flex align-center ga-3">
					<VIcon
						icon="shoe-prints"
						size="20"
					/>
					<div class="flex-1-1">
						<div class="text-caption text-uppercase font-weight-medium">
							{{ $t('leisure.ladder.nextRung') }}
						</div>
						<div class="text-body-1 font-weight-medium">{{ nudgeItem.activity.name }}</div>
						<div class="text-caption">{{ $t('leisure.ladder.nextRungHint') }}</div>
					</div>
				</VCardText>
			</VCard>
			<div
				class="ladder"
				v-auto-animate
			>
				<div
					v-for="step in RUNG_ORDER"
					:key="step"
					class="rung"
				>
					<div class="rung-marker">
						<div
							class="rung-badge"
							:style="{ backgroundColor: `rgb(var(--v-theme-${comfortZoneColor(step)}))` }"
						>
							{{ step }}
						</div>
						<div
							v-if="step !== RUNG_ORDER[RUNG_ORDER.length - 1]"
							class="rung-line"
						/>
					</div>
					<div class="rung-body">
						<div class="d-flex align-center ga-2 mb-2">
							<span class="text-subtitle-2 font-weight-medium">
								{{ $t(`leisure.ladder.rungLabels.${step}`) }}
							</span>
							<VChip
								size="x-small"
								variant="tonal"
							>
								{{ grouped.get(step)?.length ?? 0 }}
							</VChip>
						</div>
						<div
							v-if="grouped.get(step)?.length"
							class="rung-items"
						>
							<VCard
								v-for="item in grouped.get(step)"
								:key="item.activityId"
								variant="outlined"
								class="rung-card"
								@click="onEdit(item)"
							>
								<VCardText class="d-flex justify-space-between align-center ga-2 py-2">
									<ActivityNameCell :activity="item.activity" />
									<div class="d-flex align-center ga-1">
										<span
											v-if="item.experienceType?.text"
											class="text-caption text-medium-emphasis"
										>
											{{ item.experienceType.text }}
										</span>
										<VIconBtn
											icon="trash"
											size="x-small"
											variant="text"
											color="base"
											:title="$t('general.delete')"
											@click.stop="onDelete(item)"
										>
											<VIcon size="14" />
										</VIconBtn>
									</div>
								</VCardText>
							</VCard>
						</div>
						<p
							v-else
							class="text-caption text-medium-emphasis rung-empty"
						>
							{{ $t('leisure.ladder.rungEmpty') }}
						</p>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import ActivityNameCell from '@/core/leisure/component/ActivityNameCell.vue'
	import { comfortZoneColor } from '@/core/leisure/component/bucketList/comfortZoneColor.ts'
	import BucketListProfileForm from '@/core/leisure/component/bucketList/BucketListProfileForm.vue'
	import { useActivityBucketListProfileCrud } from '@/core/leisure/api/activityBucketListProfileApi.ts'
	import type { ActivityBucketListProfile } from '@/core/leisure/dto/response/ActivityBucketListProfile.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const { items, loading } = defineProps<{ items: ActivityBucketListProfile[]; loading: boolean }>()
	const emit = defineEmits<{ onReload: [] }>()
	// Ascending, so the page reads top-to-bottom in climb order — rung 1 first, rung 5 last.
	const RUNG_ORDER = [1, 2, 3, 4, 5]

	const { t } = useI18n()
	const { deleteEntity } = useActivityBucketListProfileCrud()
	const { openDialog } = useDialog()

	const isEmpty = computed(() => items.length === 0)

	const grouped = computed(() => {
		const map = new Map<number, ActivityBucketListProfile[]>(RUNG_ORDER.map(step => [step, []]))
		for (const item of items) {
			map.get(item.comfortZoneStep)?.push(item)
		}
		return map
	})

	// No "experienced" field exists on this DTO yet (that lands with the bucket-list -> memory-anchor
	// loop), so every item counts as not-yet-had — the lowest rung with anything on it is the next step.
	const nudgeItem = computed<ActivityBucketListProfile | null>(() => {
		for (const step of RUNG_ORDER) {
			const first = grouped.value.get(step)?.[0]
			if (first) return first
		}
		return null
	})

	async function openCreateDialog() {
		const result = await openDialog({
			component: BucketListProfileForm,
			dialogProps: { title: t('leisure.bucketList'), confirmBtnLabel: t('general.create') },
		})
		if (result) emit('onReload')
	}

	async function onEdit(item: ActivityBucketListProfile) {
		const result = await openDialog({
			component: BucketListProfileForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.bucketList'), confirmBtnLabel: t('general.save') },
		})
		if (result) emit('onReload')
	}

	async function onDelete(item: ActivityBucketListProfile) {
		await deleteEntity(item.activityId)
		emit('onReload')
	}
</script>

<style scoped>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 24px;
		text-align: center;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}

	.nudge-card {
		cursor: pointer;
	}

	.ladder {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.rung {
		display: flex;
		gap: 12px;
	}

	.rung-marker {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.rung-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		color: white;
		font-weight: 600;
		font-size: 0.8rem;
		flex-shrink: 0;
	}

	.rung-line {
		flex: 1 1 auto;
		width: 2px;
		min-height: 16px;
		background-color: rgba(var(--v-theme-on-surface), 0.15);
	}

	.rung-body {
		flex: 1 1 auto;
		padding-bottom: 16px;
		min-width: 0;
	}

	.rung-items {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.rung-card {
		cursor: pointer;
	}

	.rung-empty {
		padding: 4px 0 8px;
		opacity: 0.7;
	}
</style>
