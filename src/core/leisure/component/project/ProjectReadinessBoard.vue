<template>
	<div class="h-100 w-100 d-flex flex-column ga-3">
		<VProgressLinear
			v-if="loading"
			indeterminate
		/>
		<template v-if="!loading && (failed || isEmpty)">
			<LeisureEmptyState
				icon="hammer"
				:message="$t('leisure.emptyStates.projects')"
				:filtered
				:failed
				@onAdd="openCreateDialog"
				@onClearFilters="emit('onClearFilters')"
				@onRetry="emit('onReload')"
			/>
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
							role="button"
							tabindex="0"
							:aria-label="$t('leisure.readinessBoard.editCard', { name: item.activity.name })"
							@click="onEdit(item)"
							@keydown.enter.space.self.prevent="onEdit(item)"
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
										:aria-label="`${$t('general.delete')}: ${item.activity.name}`"
										@click.stop="onDelete(item)"
									>
										<VIcon size="14" />
									</VIconBtn>
								</div>
								<div class="text-caption text-medium-emphasis">
									{{ metaLine(item) }}
									<VIcon
										v-if="item.isMessy"
										icon="broom"
										color="warningDark"
										size="12"
										class="ml-1"
										:title="$t('leisure.fields.isMessy')"
									/>
									<!-- Same convention as `ProjectTable`'s Messy column: a click-less `VIcon` is
									     `aria-hidden`, so the state is carried by sr-only text beside it. -->
									<span
										v-if="item.isMessy"
										class="d-sr-only"
									>
										{{ $t('leisure.a11y.messy') }}
									</span>
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
									<!-- FO13: once the shopping is on a list, ticking it there moves this card, so say that
									     instead of offering a second handoff. Deleting the item clears the link server-side and
									     brings the button back. -->
									<div
										v-if="item.shoppingTodoListItemId != null"
										class="d-flex align-start ga-1 mt-1 text-caption text-medium-emphasis"
									>
										<VIcon
											icon="list-check"
											size="12"
											class="mt-1"
										/>
										<span>{{ $t('leisure.shoppingHandoff.onList') }}</span>
									</div>
									<!-- `.stop` because the card is itself a button: Enter on this one fires a click that
									     would otherwise bubble into the card's edit dialog (the card's keydown is `.self`). -->
									<div
										v-else-if="item.materialsNeeded.length || item.requiredTools.length"
										class="mt-1"
									>
										<VBtn
											color="warning"
											variant="tonal"
											size="x-small"
											prependIcon="list-check"
											:aria-label="
												$t('leisure.shoppingHandoff.addButtonA11y', {
													name: item.activity.name,
												})
											"
											@click.stop="onAddToTodoList(item)"
										>
											{{ $t('leisure.shoppingHandoff.addButton') }}
										</VBtn>
									</div>
								</div>
								<!-- Inactive is outlined `neutral-600`, not tonal `grey-lighten-2`: that tonal computes to a
								     transparent background, leaving a near-white glyph on the card (F5). `neutral-600` flips
								     per theme (#4B5563 light, #9CA3AF dark) and clears 3:1 on both backgrounds; `textMuted`
								     only scraped 3.0:1 on the light theme's #CCC. Filled-vs-outlined keeps the active status
								     unmistakable — it is the control's only state indicator. -->
								<div
									class="d-flex ga-1"
									@click.stop
								>
									<VBtn
										v-for="s in COLUMN_ORDER"
										:key="s"
										:color="s === item.readinessStatus ? STATUS_META[s].color : 'neutral-600'"
										:variant="s === item.readinessStatus ? 'elevated' : 'outlined'"
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
	import LeisureEmptyState from '@/core/leisure/component/LeisureEmptyState.vue'
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import ActivityNameCell from '@/core/leisure/component/ActivityNameCell.vue'
	import ProjectProfileForm from '@/core/leisure/component/project/ProjectProfileForm.vue'
	import ShoppingToTodoDialog from '@/core/leisure/component/project/ShoppingToTodoDialog.vue'
	import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
	import { ActivityProjectProfileRequest } from '@/core/leisure/dto/request/ActivityProjectProfileRequest.ts'
	import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
	import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'

	const {
		items,
		loading,
		filtered = false,
		failed = false,
	} = defineProps<{
		items: ActivityProjectProfile[]
		loading: boolean
		/** Whether the view's filter has anything set — tells "nothing matches" from "you have none" (F79). */
		filtered?: boolean
		/** The last load rejected — renders the error branch, never the empty copy (F61). */
		failed?: boolean
	}>()
	const emit = defineEmits<{ onReload: []; onClearFilters: [] }>()
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
	const { shouldConfirm } = useDeleteConfirmation()

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

	// One join, not a separator per optional field — each field guessing its own `· ` is how two of
	// them ran together ("Woodworking· 8.5h").
	function metaLine(item: ActivityProjectProfile): string {
		const parts = [t(`enums.difficultyLevel.${item.difficultyLevel}`)]
		if (item.projectArea) parts.push(item.projectArea)
		if (item.estimatedHours) parts.push(`${item.estimatedHours}h`)
		return parts.join(' · ')
	}

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

	// One item for the project's own activity, its shopping list as steps. The dialog links it to the project
	// (FO13), so ticking it off moves the card to Ready to start on its own; reload so the card says that.
	async function onAddToTodoList(item: ActivityProjectProfile) {
		const result = await openDialog({
			component: ShoppingToTodoDialog,
			componentProps: {
				projectId: item.id,
				activityId: item.activityId,
				projectName: item.activity.name,
				materialsNeeded: item.materialsNeeded,
				requiredTools: item.requiredTools,
			},
			dialogProps: {
				title: t('leisure.shoppingHandoff.title', { name: item.activity.name }),
				confirmBtnLabel: t('general.add'),
			},
		})
		if (result) emit('onReload')
	}

	// A leaf with no undo, so the user's `askBeforeDelete` decides — the same call as the ladder's.
	async function onDelete(item: ActivityProjectProfile) {
		if (shouldConfirm({ cascades: false, undoable: false })) {
			const confirmed = await confirm({
				title: t('general.deleteConfirmationTitle'),
				text: t('general.deleteConfirmationText', { name: item.activity.name }),
				confirmBtnColor: 'error',
			})
			if (!confirmed) return
		}
		await deleteEntity(item.id)
		emit('onReload')
	}

	// The whole point of the board: one click moves a card, instead of opening a nine-field dialog to
	// change one enum. The backend has no status-only patch route yet, so this round-trips the full
	// profile — see prompts/leisure/backend/P1-backend.md for the ask.
	async function onStatusChange(item: ActivityProjectProfile, status: ReadinessStatus) {
		if (status === item.readinessStatus || pendingIds.value.has(item.activityId)) return
		pendingIds.value.add(item.activityId)
		try {
			await update(item.id, ActivityProjectProfileRequest.fromProfile(item, status))
			emit('onReload')
		} finally {
			pendingIds.value.delete(item.activityId)
		}
	}
</script>

<style scoped>
	.readiness-board {
		display: grid;
		grid-template-columns: repeat(3, minmax(260px, 1fr));
		gap: 16px;
		overflow-x: auto;
		align-items: start;
	}

	/* Below `sm` three 260 px columns showed 1.4 at a time and cut a card through its title. Stacked,
	   every card is whole; an empty column is only its "No projects" line. */
	@media (max-width: 599.98px) {
		.readiness-board {
			grid-template-columns: 1fr;
		}
	}

	.readiness-column-cards {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.readiness-card {
		cursor: pointer;
	}

	.readiness-card:focus-visible {
		outline: 2px solid rgb(var(--v-theme-secondary));
		outline-offset: 2px;
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
