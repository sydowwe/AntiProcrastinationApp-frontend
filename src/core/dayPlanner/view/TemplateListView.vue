<template>
	<div class="py-6 w-100">
		<div class="mb-5 d-flex justify-space-between align-center">
			<h1 class="text-h4">{{ $t('planner.template.pageTitle') }}</h1>
			<div class="d-flex align-center ga-3">
				<template v-if="mdAndUp && templates.length >= 2">
					<VBtn
						v-if="!compareMode"
						color="secondaryOutline"
						variant="tonal"
						prependIcon="columns"
						@click="compareMode = true"
					>
						{{ $t('planner.actions.compare') }}
					</VBtn>
					<template v-else>
						<VBtn
							color="primary"
							prependIcon="columns"
							:disabled="compareSelection.length !== 2"
							@click="openComparison"
						>
							{{ $t('planner.template.compareCount', { count: compareSelection.length }) }}
						</VBtn>
						<VBtn
							color="secondaryOutline"
							variant="outlined"
							@click="exitCompareMode"
						>
							{{ $t('general.cancel') }}
						</VBtn>
					</template>
				</template>
				<VSelect
					v-model="sortBy"
					:items="sortOptions"
					density="compact"
					variant="outlined"
					hideDetails
					style="min-width: 170px"
				/>
				<VBtn
					v-if="mdAndUp"
					color="secondaryOutline"
					variant="tonal"
					prependIcon="code-compare"
					@click="router.push({ name: 'dayPlannerTemplateSplit' })"
				>
					{{ $t('planner.template.editSideBySide') }}
				</VBtn>
				<VBtn
					color="primary"
					prependIcon="plus"
					@click="openCreateDialog"
				>
					{{ $t('planner.template.addTemplate') }}
				</VBtn>
			</div>
		</div>

		<VRow
			class="w-100 mt-16"
			v-if="!templates.length && !fullScreenLoading"
			justify="center"
		>
			<VCol
				cols="12"
				lg="4"
			>
				<VCard
					class="text-center pa-8"
					variant="flat"
				>
					<VIcon
						icon="calendar-plus"
						size="48"
						class="mb-4 text-grey"
					/>
					<div class="text-h6 mb-2">{{ $t('planner.template.emptyTitle') }}</div>
					<VBtn
						color="primary"
						@click="openCreateDialog"
					>
						{{ $t('planner.template.emptyCta') }}
					</VBtn>
				</VCard>
			</VCol>
		</VRow>

		<template v-if="templates.length && !fullScreenLoading">
			<!-- Pinned templates -->
			<template v-if="pinnedTemplates.length">
				<div class="ml-2 mb-3 text-h6">
					<VIcon
						icon="thumbtack"
						size="12"
						class="mr-1"
					/>
					{{ $t('planner.template.pinnedSectionTitle') }}
				</div>
				<TemplateCardGrid
					:templates="pinnedTemplates"
					section="pinned"
					isPinned
					:templateTasksMap
					:compareMode
					:compareSelection
					:registerCard
					:dragOverState
					@click="openTemplate"
					@edit="openEditDialog"
					@delete="confirmDelete"
					@togglePin="togglePin"
					@toggleActive="toggleActive"
					@applyToday="applyToToday"
					@duplicate="duplicateTemplate"
					@toggleCompare="toggleCompareSelection"
				/>
				<VDivider
					v-if="unpinnedTemplates.length"
					class="my-5"
				/>
			</template>

			<!-- Active unpinned templates -->
			<TemplateCardGrid
				v-if="activeUnpinnedTemplates.length"
				:templates="activeUnpinnedTemplates"
				section="active"
				:isPinned="false"
				:templateTasksMap
				:compareMode
				:compareSelection
				:registerCard
				:dragOverState
				@click="openTemplate"
				@edit="openEditDialog"
				@delete="confirmDelete"
				@togglePin="togglePin"
				@toggleActive="toggleActive"
				@applyToday="applyToToday"
				@duplicate="duplicateTemplate"
				@toggleCompare="toggleCompareSelection"
			/>

			<!-- Inactive templates -->
			<template v-if="inactiveUnpinnedTemplates.length">
				<VDivider class="mt-5 mb-2" />
				<div class="ml-2 mb-3 text-h6">
					<VIcon
						icon="eye-slash"
						size="12"
						class="mr-1"
					/>
					{{ $t('planner.template.inactiveSectionTitle') }}
				</div>
				<TemplateCardGrid
					:templates="inactiveUnpinnedTemplates"
					section="inactive"
					:isPinned="false"
					:templateTasksMap
					:compareMode
					:compareSelection
					:registerCard
					:dragOverState
					@click="openTemplate"
					@edit="openEditDialog"
					@delete="confirmDelete"
					@togglePin="togglePin"
					@toggleActive="toggleActive"
					@applyToday="applyToToday"
					@duplicate="duplicateTemplate"
					@toggleCompare="toggleCompareSelection"
				/>
			</template>
		</template>

		<!-- Comparison Dialog -->
		<TemplateComparisonDialog
			v-model="compareDialog"
			:templateIds="compareSelection"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import { TaskPlannerDayTemplateRequest } from '@/core/dayPlanner/dto/request/template/TaskPlannerDayTemplateRequest.ts'
	import TemplateDetailsForm from '@/core/dayPlanner/component/template/TemplateDetailsForm.vue'
	import TemplateCardGrid from '@/core/dayPlanner/component/template/TemplateCardGrid.vue'
	import TemplateComparisonDialog from '@/core/dayPlanner/component/template/TemplateComparisonDialog.vue'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'
	import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'
	import { readUserScoped, userScopedKey } from '@/core/user/composable/useUserScopedStorage.ts'
	import { usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
	import { TemplatePlannerTaskFilter } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskFilter.ts'
	import { TemplatePlannerTaskRequest } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskRequest.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'

	import { useDisplay } from 'vuetify'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { useTemplateCardDragAndDrop } from '@/core/dayPlanner/composable/useTemplateCardDragAndDrop.ts'
	import { useTemplateCompare } from '@/core/dayPlanner/composable/useTemplateCompare.ts'

	const { showFullScreenLoading, hideFullScreenLoading, fullScreenLoading, axiosSuccessLoadingHide } = useLoading()
	const { mdAndUp } = useDisplay()
	const router = useRouter()
	const { fetchAll, create, update, deleteEntity, setPinned } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchFiltered: fetchFilteredTasks, createWithResponse: createTaskWithResponse } =
		useTemplatePlannerTaskCrud()
	const { showSuccessSnackbar } = useSnackbar()
	const { openDialog, confirm } = useDialog()
	const { shouldConfirm } = useDeleteConfirmation()
	const i18n = useI18n()

	const templates = ref<TaskPlannerDayTemplate[]>([])
	const templateTasksMap = ref<Map<number, TemplatePlannerTask[]>>(new Map())

	type SortOption = 'mostUsed' | 'recentlyUsed' | 'alphabetical'
	const sortBy = ref<SortOption>('mostUsed')
	const sortOptions = [
		{ title: i18n.t('planner.template.sort.mostUsed'), value: 'mostUsed' },
		{ title: i18n.t('planner.template.sort.recentlyUsed'), value: 'recentlyUsed' },
		{ title: i18n.t('planner.template.sort.alphabetical'), value: 'alphabetical' },
	]

	function activeFirst(a: { isActive: boolean }, b: { isActive: boolean }) {
		return Number(b.isActive) - Number(a.isActive)
	}

	const sortedTemplates = computed(() => {
		const sorted = [...templates.value]
		switch (sortBy.value) {
			case 'mostUsed':
				return sorted.sort((a, b) => activeFirst(a, b) || b.usageCount - a.usageCount)
			case 'recentlyUsed':
				return sorted.sort((a, b) => {
					if (activeFirst(a, b) !== 0) return activeFirst(a, b)
					if (!a.lastUsedAt && !b.lastUsedAt) return 0
					if (!a.lastUsedAt) return 1
					if (!b.lastUsedAt) return -1
					return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
				})
			case 'alphabetical':
				return sorted.sort((a, b) => activeFirst(a, b) || a.name.localeCompare(b.name))
			default:
				return sorted.sort(activeFirst)
		}
	})

	// B5 answered: pinned-ness is now a property of the template itself (`isPinned`, set through
	// `PATCH task-planner-day-template/{id}/pinned`), so it follows the account to every device.
	// The old per-device `localStorage` set is gone; `migrateLegacyPins` below carries any pins a
	// user made before the cutover up to the server, once.
	const { applyOrder, registerCard, dragOverState } = useTemplateCardDragAndDrop()

	const pinnedTemplates = computed(() =>
		applyOrder(
			sortedTemplates.value.filter(t => t.isPinned),
			'pinned',
		),
	)
	const unpinnedTemplates = computed(() => sortedTemplates.value.filter(t => !t.isPinned))
	const activeUnpinnedTemplates = computed(() =>
		applyOrder(
			unpinnedTemplates.value.filter(t => t.isActive),
			'active',
		),
	)
	const inactiveUnpinnedTemplates = computed(() =>
		applyOrder(
			unpinnedTemplates.value.filter(t => !t.isActive),
			'inactive',
		),
	)

	async function togglePin(templateId: number) {
		const template = templates.value.find(t => t.id === templateId)
		if (!template) return
		const next = !template.isPinned
		// Optimistic: the card should not lag a round trip. On failure the interceptor shows the
		// snackbar and we put the card back where it was rather than leaving a lie on screen.
		template.isPinned = next
		try {
			await setPinned(templateId, next)
		} catch {
			template.isPinned = !next
		}
	}

	async function toggleActive(template: TaskPlannerDayTemplate) {
		const request = TaskPlannerDayTemplateRequest.fromEntity(template)
		request.isActive = !template.isActive
		await update(template.id, request)
		await loadTemplates()
	}

	let duplicatingFromId: number | null = null

	const { compareMode, compareSelection, compareDialog, toggleCompareSelection, openComparison, exitCompareMode } =
		useTemplateCompare()

	async function loadTemplates() {
		showFullScreenLoading()
		axiosSuccessLoadingHide.value = false
		templates.value = await fetchAll()
		// Fetch tasks for mini-timeline previews
		const taskResults = await Promise.all(
			templates.value.map(t =>
				fetchFilteredTasks(new TemplatePlannerTaskFilter(t.id, t.defaultWakeUpTime, t.defaultBedTime)).then(
					tasks => [t.id, tasks] as const,
				),
			),
		)
		templateTasksMap.value = new Map(taskResults)
		hideFullScreenLoading()
	}

	async function openTemplateDialog(
		template: TaskPlannerDayTemplate | null,
		defaultValues: TaskPlannerDayTemplateRequest | null = null,
	) {
		const result = await openDialog<{ request: TaskPlannerDayTemplateRequest }>({
			component: TemplateDetailsForm,
			componentProps: { template, defaultValues },
			dialogProps: {
				title: template ? i18n.t('planner.template.editTitle') : i18n.t('planner.template.newTitle'),
				confirmBtnLabel: template ? i18n.t('general.update') : i18n.t('general.create'),
			},
		})
		if (!result) {
			duplicatingFromId = null
			return
		}
		await handleSaveTemplate(template, result.request)
	}

	function openCreateDialog() {
		duplicatingFromId = null
		openTemplateDialog(null)
	}

	function openEditDialog(template: TaskPlannerDayTemplate) {
		duplicatingFromId = null
		openTemplateDialog(template)
	}

	function duplicateTemplate(template: TaskPlannerDayTemplate) {
		const defaults = TaskPlannerDayTemplateRequest.fromEntity(template)
		defaults.name = i18n.t('planner.template.copySuffix', { name: template.name })
		duplicatingFromId = template.id
		openTemplateDialog(null, defaults)
	}

	async function handleSaveTemplate(
		editingTemplate: TaskPlannerDayTemplate | null,
		request: TaskPlannerDayTemplateRequest,
	) {
		if (editingTemplate) {
			await update(editingTemplate.id, request)
			await loadTemplates()
			showSuccessSnackbar(i18n.t('planner.feedback.templateUpdated'))
		} else {
			const newId = await create(request)

			// If duplicating, copy all tasks from the original template
			if (duplicatingFromId) {
				const originalTasks = await fetchFilteredTasks(
					new TemplatePlannerTaskFilter(duplicatingFromId, new Time(0, 0), new Time(23, 50)),
				)
				await Promise.all(
					originalTasks.map(task => {
						const taskRequest = TemplatePlannerTaskRequest.fromEntity(task)
						taskRequest.templateId = newId as number
						return createTaskWithResponse(taskRequest)
					}),
				)
			}

			duplicatingFromId = null
			await router.push({
				name: 'dayPlannerTemplate',
				params: { templateId: newId },
			})
		}
	}

	function openTemplate(templateId: number) {
		router.push({
			name: 'dayPlannerTemplate',
			params: { templateId },
		})
	}

	function applyToToday(templateId: number) {
		const todayUrlDate = usStringToUrlString(isoDateInUserZone())
		router.push({
			name: 'dayPlanner',
			params: { date: todayUrlDate },
			query: { applyTemplateId: templateId.toString() },
		})
	}

	// A template carries its own tasks — `templateTasksMap` is already loaded for the cards, so the
	// count is free. Reconstructing a template by hand is real work, so a non-empty one always
	// confirms regardless of the preference.
	function templateTaskCount(template: TaskPlannerDayTemplate) {
		return templateTasksMap.value.get(template.id)?.length ?? 0
	}

	async function confirmDelete(template: TaskPlannerDayTemplate) {
		const taskCount = templateTaskCount(template)
		if (shouldConfirm({ cascades: taskCount > 0, undoable: false })) {
			const confirmed = await confirm({
				title: i18n.t('planner.templateDelete.title'),
				text: i18n.t('planner.templateDelete.body', { name: template.name }),
				detail: taskCount > 0 ? i18n.t('planner.templateDelete.cascade', { count: taskCount }) : undefined,
				confirmBtnLabel: i18n.t('general.delete'),
				confirmBtnColor: 'errorDark',
			})
			if (!confirmed) return
		}
		await deleteTemplate(template)
	}

	async function deleteTemplate(template: TaskPlannerDayTemplate) {
		await deleteEntity(template.id)
		await loadTemplates()
		showSuccessSnackbar(i18n.t('planner.feedback.templateDeleted'))
	}

	/**
	 * One-time carry-over of the pre-B5 per-device pin set. Runs before the first load, pushes each
	 * locally pinned id that the server does not already have, then drops the key so it never runs
	 * again. Losing someone's pins to the cutover would be a self-inflicted version of the bug B5
	 * fixed, so this is worth the one extra pass; a failure is swallowed because the key is only
	 * removed after the writes land, so the next visit retries.
	 */
	const LEGACY_PINNED_KEY = 'pinnedTemplateIds'
	async function migrateLegacyPins() {
		const raw = readUserScoped(LEGACY_PINNED_KEY)
		if (!raw) return
		try {
			const legacyIds: number[] = JSON.parse(raw)
			const stillUnpinned = templates.value.filter(t => !t.isPinned && legacyIds.includes(t.id))
			await Promise.all(stillUnpinned.map(t => setPinned(t.id, true)))
			localStorage.removeItem(userScopedKey(LEGACY_PINNED_KEY))
			if (stillUnpinned.length) await loadTemplates()
		} catch {
			// Unparseable JSON or a failed write: leave the key in place and try again next visit.
		}
	}

	onMounted(async () => {
		await loadTemplates()
		await migrateLegacyPins()
	})
</script>
<style scoped>
	.v-col-lg-4 {
		padding: 10px;
	}
</style>
