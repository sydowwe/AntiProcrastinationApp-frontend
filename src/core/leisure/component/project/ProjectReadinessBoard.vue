<template>
	<div class="h-100 w-100 d-flex flex-column ga-3">
		<VProgressLinear
			v-if="loading"
			indeterminate
		/>
		<template v-if="!loading && isEmpty">
			<div class="empty-state">
				<VIcon
					icon="hammer"
					size="40"
					class="mb-3"
					style="opacity: 0.3"
				/>
				<p class="text-subtitle-2 font-weight-medium mb-3">{{ $t('leisure.emptyStates.projects') }}</p>
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
			<div class="readiness-board">
				<div
					v-for="status in COLUMN_ORDER"
					:key="status"
					class="readiness-column"
				>
					<div class="d-flex align-center ga-2 mb-2">
						<VIcon
							:icon="STATUS_META[status].icon"
							:color="STATUS_META[status].color"
							size="16"
						/>
						<span class="text-subtitle-2 font-weight-medium">
							{{ $t(`enums.readinessStatus.${status}`) }}
						</span>
						<VChip
							size="x-small"
							variant="tonal"
						>
							{{ grouped.get(status)?.length ?? 0 }}
						</VChip>
					</div>
					<div
						class="readiness-column-cards"
						v-auto-animate
					>
						<VCard
							v-for="item in grouped.get(status)"
							:key="item.activityId"
							class="readiness-card"
							variant="outlined"
							:loading="pendingIds.has(item.activityId)"
							@click="onEdit(item)"
						>
							<VCardText class="d-flex flex-column ga-2">
								<div class="d-flex justify-space-between align-start ga-2">
									<ActivityNameCell :activity="item.activity" />
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
								<div class="text-caption text-medium-emphasis">
									{{ $t(`enums.difficultyLevel.${item.difficultyLevel}`) }}
									<template v-if="item.projectArea">· {{ item.projectArea }}</template>
									<template v-if="item.estimatedHours">· {{ item.estimatedHours }}h</template>
									<VIcon
										v-if="item.isMessy"
										icon="broom"
										color="warningDark"
										size="12"
										class="ml-1"
										:title="$t('leisure.fields.isMessy')"
									/>
								</div>
								<div
									v-if="status === ReadinessStatus.NeedsShopping"
									class="readiness-blockers"
								>
									<div
										v-if="item.materialsNeeded.length"
										class="d-flex align-start ga-1"
									>
										<VIcon
											icon="box"
											size="12"
											class="mt-1"
										/>
										<span class="text-caption">{{ blockerLine(item.materialsNeeded) }}</span>
									</div>
									<div
										v-if="item.requiredTools.length"
										class="d-flex align-start ga-1"
									>
										<VIcon
											icon="wrench"
											size="12"
											class="mt-1"
										/>
										<span class="text-caption">{{ blockerLine(item.requiredTools) }}</span>
									</div>
								</div>
								<div
									class="d-flex ga-1"
									@click.stop
								>
									<VBtn
										v-for="s in COLUMN_ORDER"
										:key="s"
										:color="s === item.readinessStatus ? STATUS_META[s].color : 'grey-lighten-2'"
										:variant="s === item.readinessStatus ? 'elevated' : 'tonal'"
										size="x-small"
										icon
										:disabled="pendingIds.has(item.activityId)"
										:title="$t(`enums.readinessStatus.${s}`)"
										@click="onStatusChange(item, s)"
									>
										<VIcon
											:icon="STATUS_META[s].icon"
											size="12"
										/>
									</VBtn>
								</div>
							</VCardText>
						</VCard>
						<p
							v-if="(grouped.get(status)?.length ?? 0) === 0"
							class="text-caption text-medium-emphasis readiness-empty"
						>
							{{ $t('leisure.readinessBoard.empty') }}
						</p>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import ActivityNameCell from '@/core/leisure/component/ActivityNameCell.vue'
	import ProjectProfileForm from '@/core/leisure/component/project/ProjectProfileForm.vue'
	import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
	import { ActivityProjectProfileRequest } from '@/core/leisure/dto/request/ActivityProjectProfileRequest.ts'
	import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
	import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const { items, loading } = defineProps<{ items: ActivityProjectProfile[]; loading: boolean }>()
	const emit = defineEmits<{ onReload: [] }>()
	// ReadyToStart first — those are the projects the user could pick up today, so they lead.
	const COLUMN_ORDER = [ReadinessStatus.ReadyToStart, ReadinessStatus.NeedsShopping, ReadinessStatus.Planning]
	const STATUS_META: Record<ReadinessStatus, { icon: string; color: string }> = {
		[ReadinessStatus.ReadyToStart]: { icon: 'circle-check', color: 'successDark' },
		[ReadinessStatus.NeedsShopping]: { icon: 'cart-shopping', color: 'warningDark' },
		[ReadinessStatus.Planning]: { icon: 'compass', color: 'secondary' },
	}

	const { t } = useI18n()
	const { update, deleteEntity } = useActivityProjectProfileCrud()
	const { openDialog, confirm } = useDialog()

	// Cards being written back to the server — disables their status buttons and shows the card's
	// own loading state so a slow status change doesn't look like a missed click.
	const pendingIds = ref<Set<number>>(new Set())

	const isEmpty = computed(() => items.length === 0)

	const grouped = computed(() => {
		const map = new Map<ReadinessStatus, ActivityProjectProfile[]>(COLUMN_ORDER.map(status => [status, []]))
		for (const item of items) {
			map.get(item.readinessStatus)?.push(item)
		}
		return map
	})

	function blockerLine(list: string[], max = 3): string {
		const shown = list.slice(0, max).join(', ')
		const extra = list.length - max
		return extra > 0 ? `${shown} ${t('leisure.readinessBoard.moreCount', { count: extra })}` : shown
	}

	async function openCreateDialog() {
		const result = await openDialog({
			component: ProjectProfileForm,
			dialogProps: { title: t('leisure.projects'), confirmBtnLabel: t('general.create') },
		})
		if (result) emit('onReload')
	}

	async function onEdit(item: ActivityProjectProfile) {
		const result = await openDialog({
			component: ProjectProfileForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.projects'), confirmBtnLabel: t('general.save') },
		})
		if (result) emit('onReload')
	}

	async function onDelete(item: ActivityProjectProfile) {
		const confirmed = await confirm({
			title: t('general.deleteConfirmationTitle'),
			text: t('general.deleteConfirmationText', { name: item.activity.name }),
			confirmBtnColor: 'error',
		})
		if (!confirmed) return
		await deleteEntity(item.activityId)
		emit('onReload')
	}

	// The whole point of the board: one click moves a card, instead of opening a nine-field dialog to
	// change one enum. The backend has no status-only patch route yet, so this round-trips the full
	// profile — see prompts/leisure/backend/P1-backend.md for the ask.
	async function onStatusChange(item: ActivityProjectProfile, status: ReadinessStatus) {
		if (status === item.readinessStatus || pendingIds.value.has(item.activityId)) return
		pendingIds.value.add(item.activityId)
		try {
			await update(item.activityId, ActivityProjectProfileRequest.fromProfile(item, status))
			emit('onReload')
		} finally {
			pendingIds.value.delete(item.activityId)
		}
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

	.readiness-board {
		display: grid;
		grid-template-columns: repeat(3, minmax(260px, 1fr));
		gap: 16px;
		overflow-x: auto;
		align-items: start;
	}

	.readiness-column-cards {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.readiness-card {
		cursor: pointer;
	}

	.readiness-blockers {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.readiness-empty {
		text-align: center;
		padding: 16px 8px;
		opacity: 0.7;
	}
</style>
