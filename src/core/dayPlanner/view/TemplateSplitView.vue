<!-- TemplateSplitView.vue - Side-by-side template editor with cross-template task drag -->
<template>
	<div class="py-4 w-100">
		<div class="mb-4 d-flex align-center ga-2">
			<VBtn
				icon="arrow-left"
				variant="tonal"
				color="secondaryOutline"
				size="small"
				:aria-label="$t('planner.a11y.backToTemplates')"
				@click="router.push({ name: 'dayPlannerTemplateList' })"
			/>
			<span class="text-h5">{{ $t('planner.template.compareEditTitle') }}</span>
		</div>

		<!-- Below md the two panes don't fit (F99). Entry is mdAndUp-only, but a shared ?left=&right= link isn't. -->
		<VAlert
			v-if="!mdAndUp"
			type="info"
			variant="tonal"
			:title="$t('planner.template.narrowScreenTitle')"
			:text="$t('planner.template.narrowScreenText')"
		>
			<div class="mt-3 d-flex flex-column align-start ga-1">
				<VBtn
					v-for="link in narrowScreenLinks"
					:key="link.id"
					variant="text"
					:to="{ name: 'dayPlannerTemplate', params: { templateId: link.id } }"
				>
					{{ $t('planner.template.openTemplate', { name: link.name }) }}
				</VBtn>
				<VBtn
					variant="text"
					:to="{ name: 'dayPlannerTemplateList' }"
				>
					{{ $t('planner.template.backToList') }}
				</VBtn>
			</div>
		</VAlert>

		<div
			v-else
			class="split-view-grid"
		>
			<!-- Left panel -->
			<div
				ref="leftPanelRef"
				class="split-panel"
				:class="{ 'drop-target-active': isDropTargetLeft }"
			>
				<VIdSelect
					v-model="leftTemplateId"
					:items="templateOptions"
					:label="$t('planner.template.leftTemplate')"
					class="mb-2"
					hideDetails
					:loading="templateOptionsLoading"
				/>
				<TemplateDayPlannerView
					v-if="leftTemplateId !== null"
					storeId="main"
					:templateId="leftTemplateId"
					isSplitView
				/>
				<div
					v-else
					class="empty-panel d-flex align-center justify-center"
				>
					<span class="text-medium-emphasis">{{ $t('planner.template.selectTemplatePlaceholder') }}</span>
				</div>
			</div>

			<VDivider vertical />

			<!-- Right panel -->
			<div
				ref="rightPanelRef"
				class="split-panel"
				:class="{ 'drop-target-active': isDropTargetRight }"
			>
				<VIdSelect
					v-model="rightTemplateId"
					:items="templateOptions"
					:label="$t('planner.template.rightTemplate')"
					class="mb-2"
					hideDetails
					:loading="templateOptionsLoading"
				/>
				<TemplateDayPlannerView
					v-if="rightTemplateId !== null"
					storeId="secondary"
					:templateId="rightTemplateId"
					isSplitView
				/>
				<div
					v-else
					class="empty-panel d-flex align-center justify-center"
				>
					<span class="text-medium-emphasis">{{ $t('planner.template.selectTemplatePlaceholder') }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import { useDisplay } from 'vuetify'
	import { dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
	import {
		useSecondaryTemplateDayPlannerStore,
		useTemplateDayPlannerStore,
	} from '@/core/dayPlanner/store/templateDayPlannerStore.ts'
	import { TemplatePlannerTaskRequest } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskRequest.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import TemplateDayPlannerView from '@/core/dayPlanner/view/TemplateDayPlannerView.vue'
	import { useQueryParamRef } from '@/core/dayPlanner/composable/useQueryParamRef.ts'
	import { useI18n } from 'vue-i18n'

	const router = useRouter()
	const { t } = useI18n()
	const { mdAndUp } = useDisplay()
	const { fetchAll } = useTaskPlannerDayTemplateTaskCrud()
	const { update: updateTask, fetchById: fetchByIdTask } = useTemplatePlannerTaskCrud()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	const mainStore = useTemplateDayPlannerStore()
	const secondaryStore = useSecondaryTemplateDayPlannerStore()

	const templateOptions = ref<{ id: number; text: string }[]>([])
	const templateOptionsLoading = ref(false)

	// `?left=` / `?right=` survive a reload (F54). Both are read only after the options load and only
	// when they name a listed template — a bogus id must never reach the grid (`F55`'s 404 path).
	// The same template on both sides is not a comparison, so the right side also rejects the left's id.
	function parseTemplateId(raw: string): number | undefined {
		const id = Number(raw)
		return Number.isInteger(id) && templateOptions.value.some(option => option.id === id) ? id : undefined
	}
	const { state: leftTemplateId, hydrate: hydrateLeft } = useQueryParamRef<number | null>('left', {
		defaultValue: null,
		parse: parseTemplateId,
		immediate: false,
	})
	const { state: rightTemplateId, hydrate: hydrateRight } = useQueryParamRef<number | null>('right', {
		defaultValue: null,
		parse: raw => {
			const id = parseTemplateId(raw)
			return id === leftTemplateId.value ? undefined : id
		},
		immediate: false,
	})

	// The picks from the URL, offered as single-template links when the split doesn't fit (F99).
	const narrowScreenLinks = computed(() =>
		[leftTemplateId.value, rightTemplateId.value]
			.filter((id): id is number => id !== null)
			.map(id => ({ id, name: templateOptions.value.find(option => option.id === id)?.text ?? '' })),
	)

	const leftPanelRef = ref<HTMLElement | null>(null)
	const rightPanelRef = ref<HTMLElement | null>(null)
	const isDropTargetLeft = ref(false)
	const isDropTargetRight = ref(false)

	const dropCleanups: (() => void)[] = []
	let monitorCleanup: (() => void) | null = null

	// The panels mount and unmount with the breakpoint, so the drop targets follow the refs, not onMounted.
	watch([leftPanelRef, rightPanelRef], setupDropTargets, { flush: 'post' })

	onMounted(async () => {
		templateOptionsLoading.value = true
		const templates = await fetchAll()
		templateOptions.value = templates.map(t => ({ id: t.id, text: t.name }))
		templateOptionsLoading.value = false
		hydrateLeft()
		hydrateRight()

		monitorCleanup = monitorForElements({
			canMonitor: ({ source }) => source.data.type === 'cross-template-task',
			onDrop: ({ source, location }) => {
				isDropTargetLeft.value = false
				isDropTargetRight.value = false

				const panelTarget = location.current.dropTargets.find(t => t.data.panel !== undefined)
				if (!panelTarget) return

				const sourceStoreId = source.data.sourceStoreId as string
				const targetStoreId = panelTarget.data.targetStoreId as string
				if (sourceStoreId === targetStoreId) return

				const targetTemplateId = panelTarget.data.targetTemplateId as number | null
				if (!targetTemplateId) return

				moveTask(source.data.taskId as number, sourceStoreId, targetStoreId, targetTemplateId)
			},
		})
	})

	function teardownDropTargets() {
		dropCleanups.splice(0).forEach(c => c())
	}

	function setupDropTargets() {
		teardownDropTargets()
		if (leftPanelRef.value) {
			dropCleanups.push(
				dropTargetForElements({
					element: leftPanelRef.value,
					canDrop: ({ source }) =>
						source.data.type === 'cross-template-task' && source.data.sourceStoreId !== 'main',
					getData: () => ({ panel: 'left', targetStoreId: 'main', targetTemplateId: leftTemplateId.value }),
					onDragEnter: () => {
						isDropTargetLeft.value = true
					},
					onDragLeave: () => {
						isDropTargetLeft.value = false
					},
				}),
			)
		}
		if (rightPanelRef.value) {
			dropCleanups.push(
				dropTargetForElements({
					element: rightPanelRef.value,
					canDrop: ({ source }) =>
						source.data.type === 'cross-template-task' && source.data.sourceStoreId !== 'secondary',
					getData: () => ({
						panel: 'right',
						targetStoreId: 'secondary',
						targetTemplateId: rightTemplateId.value,
					}),
					onDragEnter: () => {
						isDropTargetRight.value = true
					},
					onDragLeave: () => {
						isDropTargetRight.value = false
					},
				}),
			)
		}
	}

	onBeforeUnmount(() => {
		monitorCleanup?.()
		teardownDropTargets()
	})

	async function moveTask(taskId: number, sourceStoreId: string, targetStoreId: string, targetTemplateId: number) {
		const sourceStore = sourceStoreId === 'main' ? mainStore : secondaryStore
		const targetStore = targetStoreId === 'main' ? mainStore : secondaryStore

		const task = sourceStore.tasks.find(t => t.id === taskId)
		if (!task) return

		const request = TemplatePlannerTaskRequest.fromEntity(task)
		request.templateId = targetTemplateId

		try {
			await updateTask(taskId, request)
			sourceStore.tasks = sourceStore.tasks.filter(t => t.id !== taskId)
			const movedTask = await fetchByIdTask(taskId)
			targetStore.setGridPositionFromSpan(movedTask)
			targetStore.tasks.push(movedTask)
			showSuccessSnackbar(t('planner.feedback.taskMovedToOtherTemplate'))
		} catch {
			showErrorSnackbar(t('planner.feedback.taskMoveFailed'))
		}
	}
</script>

<style scoped>
	.split-view-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 16px;
		height: calc(100vh - 140px);
	}

	.split-panel {
		min-width: 0;
		overflow: hidden;
		transition: outline 0.15s;
		border-radius: 8px;
	}

	.split-panel.drop-target-active {
		outline: 2px solid rgb(var(--v-theme-primary));
	}

	.empty-panel {
		height: 400px;
		border: 2px dashed rgb(var(--v-theme-neutral-300));
		border-radius: 8px;
	}
</style>
