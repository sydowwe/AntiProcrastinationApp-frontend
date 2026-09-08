<template>
	<div class="h-100 w-100 d-flex flex-column">
		<div v-auto-animate>
			<VSheet
				v-if="selectedActivities.length > 0"
				class="d-flex align-center flex-wrap ga-3 px-3 py-2 mb-2"
				rounded="lg"
				color="primary-container"
			>
				<span class="text-body-2">
					{{ t('activities.merge.selectedCount', { count: selectedActivities.length }) }}
				</span>
				<VBtn
					size="small"
					color="secondaryOutline"
					variant="outlined"
					prependIcon="code-merge"
					:disabled="selectedActivities.length < 2"
					@click="openMergeDialog"
				>
					{{ t('activities.merge.action') }}
				</VBtn>
				<span
					v-if="selectedActivities.length < 2"
					class="text-body-2 text-textMuted"
				>
					{{ t('activities.merge.needsTwo') }}
				</span>
				<VSpacer />
				<VBtn
					size="small"
					variant="text"
					prependIcon="xmark"
					@click="clearSelection"
				>
					{{ t('general.unselect') }}
				</VBtn>
			</VSheet>
		</div>

		<BasicTable
			class="flex-1-1"
			style="min-height: 0"
			:items
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			v-model:selected="selected"
			:loading
			:columns
			:itemsLength
			showActions
			showSelect
			@onLoadItems="loadItems"
			@onAdd="openCreateDialog"
			@onEdit="onEdit"
		>
			<template #item.name="{ item }">
				<div
					class="d-flex align-center justify-center ga-2"
					:class="dimmed(item)"
				>
					<VIcon
						v-if="item.isArchived"
						icon="box-archive"
						size="14"
						:title="t('activities.archive.archivedRow')"
					/>
					<span>{{ item.name }}</span>
				</div>
			</template>
			<template #item.role.name="{ item }">
				<span :class="dimmed(item)">{{ item.role?.name ?? '—' }}</span>
			</template>
			<template #item.category.name="{ item }">
				<span :class="dimmed(item)">{{ item.category?.name ?? '—' }}</span>
			</template>
			<template #item.text="{ item }">
				<span :class="dimmed(item)">{{ item.text || '—' }}</span>
			</template>
			<template #item.usageCount="{ item }">
				<span :class="dimmed(item)">{{ item.usageCount }}</span>
			</template>
			<template #item.isUnavoidable="{ item }">
				<VIcon
					:class="dimmed(item)"
					:color="item.isUnavoidable ? 'successDark' : 'grey'"
					:icon="item.isUnavoidable ? 'check' : 'xmark'"
					size="16"
				/>
			</template>

			<template #actions="{ item }">
				<VIconBtn
					icon="pen"
					variant="tonal"
					size="small"
					color="secondaryOutline"
					:title="t('general.edit')"
					:disabled="busyId === item.id"
					@click="onEdit(item)"
				>
					<VIcon size="15"></VIcon>
				</VIconBtn>
				<VIconBtn
					:icon="item.isArchived ? 'box-open' : 'box-archive'"
					variant="tonal"
					size="small"
					:color="item.isArchived ? 'successDark' : 'warning'"
					:title="item.isArchived ? t('activities.archive.unarchive') : t('activities.archive.archive')"
					:disabled="busyId === item.id"
					@click="onToggleArchived(item)"
				>
					<VIcon size="15"></VIcon>
				</VIconBtn>
				<!--
					A disabled VBtn takes no pointer events, so the tooltip hangs off this wrapper instead —
					saying why the button is dead is the entire point of disabling it rather than letting the
					delete 409.
				-->
				<span class="d-inline-flex">
					<VIconBtn
						icon="trash"
						variant="tonal"
						size="small"
						color="base"
						:disabled="!item.canDelete || busyId === item.id"
						@click="onDeleteActivity(item)"
					>
						<VIcon size="15"></VIcon>
					</VIconBtn>
					<VTooltip
						activator="parent"
						location="top"
						:text="item.canDelete ? t('general.delete') : t('activities.archive.deleteBlocked')"
					/>
				</span>
			</template>

			<template #noData>
				<TableEmptyState
					:explanation="t('activities.noActivitiesInTable')"
					:isFiltered
					:filteredExplanation="archivedOnlyView ? t('activities.archive.noneArchived') : undefined"
					:createLabel="t('activities.createNewActivity')"
					@create="openCreateDialog"
				/>
			</template>
		</BasicTable>
	</div>
</template>

<script setup lang="ts">
	import type { Ref } from 'vue'
	import { computed, ref, toRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import TableEmptyState from '@/core/activity/component/TableEmptyState.vue'
	import ActivityForm from '@/core/activity/component/ActivityForm.vue'
	import MergeActivitiesDialog from '@/core/activity/component/MergeActivitiesDialog.vue'
	import { Activity } from '@/core/activity/dto/response/Activity.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { ActivityFilter } from '@/core/activity/dto/request/ActivityFilter.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useLookupTable } from '@/core/activity/composable/useLookupTable.ts'

	const props = defineProps<{ filter: ActivityFilter }>()

	const { t } = useI18n()
	const { deleteEntity, setArchived } = useActivityCrud()
	const { openDialog, confirm } = useDialog()
	const { showSuccessSnackbar } = useSnackbar()

	const columns = computed(() => [
		new TableColumn('name', t('general.name')),
		new TableColumn('role.name', t('activities.role'), false),
		new TableColumn('category.name', t('activities.category'), false),
		new TableColumn('text', t('general.text'), false),
		new TableColumn('isUnavoidable', t('activities.unavoidable'), false),
		new TableColumn('usageCount', t('activities.archive.usageCount')),
	])

	const { items, itemsLength, itemsPerPage, page, sortBy, loading, isFiltered, loadItems, onDelete } = useLookupTable<
		Activity,
		ActivityFilter
	>({
		filter: toRef(props, 'filter'),
		responseClass: Activity,
		entityName: 'activity',
		deleteEntity,
		columns,
		// `isArchived === false` is the default view, and the server applies it whether or not a filter
		// object arrives — so it is the one value that must NOT count as filtering, or the default view
		// would start sending a filter it never sent before and the empty state would stop explaining
		// what an activity is.
		hasFilter: f =>
			!!f.name ||
			!!f.text ||
			!!f.roleName ||
			!!f.roleIds?.length ||
			!!f.categoryName ||
			!!f.categoryIds?.length ||
			f.isArchived !== false,
	})

	/** The row a lifecycle request is in flight for; its actions are dead until it resolves. */
	const busyId = ref<number | null>(null)
	const selected = ref<(string | number)[]>([])
	// Selection survives paging, so the selected rows are not all in `items`. Keeping the objects means
	// the merge dialog can show a role, a category and a usage count for a row that scrolled off page 1.
	const selectionCache = ref(new Map<number, Activity>()) as Ref<Map<number, Activity>>

	const selectedActivities = computed(() => [...selectionCache.value.values()])

	/**
	 * The archived-only view has its own empty state: "nothing matches the filter" is true but useless
	 * when the filter is "show me what I retired" and the answer is that nothing has been retired yet.
	 */
	const archivedOnlyView = computed(() => props.filter.isArchived === true)

	function dimmed(item: Activity) {
		return item.isArchived ? 'archived-row' : ''
	}

	watch(
		[selected, items],
		() => {
			const next = new Map<number, Activity>()
			for (const rawId of selected.value) {
				const id = Number(rawId)
				const known = items.value.find(item => item.id === id) ?? selectionCache.value.get(id)
				if (known) next.set(id, known)
			}
			selectionCache.value = next
		},
		{ deep: true },
	)

	// A row that is no longer in the table it was selected from cannot be reasoned about — the filter
	// that produced it is gone. Every mutation below clears the selection for the same reason.
	watch(() => props.filter, clearSelection, { deep: true })

	function clearSelection() {
		selected.value = []
		selectionCache.value = new Map()
	}

	async function openCreateDialog() {
		const result = await openDialog({
			component: ActivityForm,
			dialogProps: {
				title: t('activities.createNewActivity'),
				confirmBtnLabel: t('general.create'),
				isSmall: false,
			},
		})
		if (result) await loadItems()
	}

	async function onEdit(item: Activity) {
		const result = await openDialog({
			component: ActivityForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('activities.editActivity'), confirmBtnLabel: t('general.save'), isSmall: false },
		})
		if (result) await loadItems()
	}

	/**
	 * Archiving is reversible and takes nothing with it, so it asks for no confirmation — the row action
	 * that needs one is delete, and it is only offered where there is nothing to lose.
	 */
	async function onToggleArchived(item: Activity) {
		busyId.value = item.id
		try {
			await setArchived(item.id, !item.isArchived)
			showSuccessSnackbar(
				item.isArchived
					? t('activities.archive.unarchived', { name: item.name })
					: t('activities.archive.archived', { name: item.name }),
			)
			clearSelection()
			await loadItems()
		} finally {
			busyId.value = null
		}
	}

	/**
	 * Confirms unconditionally, as this table always has. `canDelete` means nothing references the
	 * activity, so there are no children to count and nothing for `useDeleteConfirmation` to weigh — but
	 * the row is still gone for good, and the archive action sitting next to it is the reversible one.
	 */
	async function onDeleteActivity(item: Activity) {
		if (!item.canDelete) return
		const confirmed = await confirm({
			title: t('general.deleteConfirmationTitle'),
			text: t('general.deleteConfirmationText', { name: item.name }),
			confirmBtnColor: 'error',
			confirmBtnLabel: t('general.delete'),
		})
		if (!confirmed) return

		busyId.value = item.id
		try {
			clearSelection()
			await onDelete(item)
		} finally {
			busyId.value = null
		}
	}

	async function openMergeDialog() {
		if (selectedActivities.value.length < 2) return
		const merged = await openDialog<boolean>({
			component: MergeActivitiesDialog,
			componentProps: { activities: selectedActivities.value },
			dialogProps: {
				title: t('activities.merge.title'),
				confirmBtnLabel: t('activities.merge.action'),
				isSmall: false,
			},
		})
		if (!merged) return
		clearSelection()
		await loadItems()
	}
</script>

<style scoped>
	/* Archived rows stay readable but stop competing with the active ones for attention. */
	.archived-row {
		opacity: 0.55;
	}
</style>
