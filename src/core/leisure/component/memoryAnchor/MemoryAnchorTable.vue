<template>
	<BasicTable
		:items
		v-model:itemsPerPage="itemsPerPage"
		v-model:page="page"
		v-model:sortBy="sortBy"
		:loading
		:columns
		:itemsLength
		showActions
		deleteConfirmationColumn="activity.name"
		@onLoadItems="emit('onLoadItems')"
		@onAdd="openCreateDialog"
		@onEdit="onEdit"
		@onDelete="onDelete"
	>
		<template #item.periodKey="{ item }">
			<span>{{ formatPeriod(item) }}</span>
		</template>
		<template #item.activity.name="{ item }">
			<ActivityNameCell :activity="item.activity" />
		</template>
		<template #item.rating="{ item }">
			<VChip
				:color="ratingColor(item.rating)"
				size="small"
			>
				{{ item.rating }}/10
			</VChip>
		</template>
		<!-- The source chip used to live in #actions, which overrode BasicTable's own edit/delete buttons
		     and hid them. As a column it keeps those, and it can be clicked back to the row it came
		     from — the same relationship the bucket list's "experienced" chip navigates in reverse. -->
		<template #item.source="{ item }">
			<VChip
				v-if="item.hasBucketList"
				size="x-small"
				color="primaryOutline"
				link
				:title="$t('leisure.experienced.openSourceHint')"
				@click="openSource(item, 'leisureBucketList')"
			>
				{{ $t('leisure.anchorSourceBucketList') }}
			</VChip>
			<VChip
				v-else-if="item.hasBacklog && item.backlogIsRepeatable === false"
				size="x-small"
				color="secondaryOutline"
				link
				:title="$t('leisure.experienced.openSourceHint')"
				@click="openSource(item, 'leisureBacklog')"
			>
				{{ $t('leisure.anchorSourceBacklog') }}
			</VChip>
			<span
				v-else
				class="text-medium-emphasis"
			>
				—
			</span>
		</template>
		<template #noData>
			<LeisureEmptyState
				icon="anchor"
				:message="$t('leisure.emptyStates.memoryAnchors')"
				:filtered
				@onAdd="openCreateDialog"
				@onClearFilters="emit('onClearFilters')"
			/>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useRouter } from 'vue-router'
	import BasicTable from '@/_common/component/dataTable/BasicTable.vue'
	import LeisureEmptyState from '@/core/leisure/component/LeisureEmptyState.vue'
	import ActivityNameCell from '@/core/leisure/component/ActivityNameCell.vue'
	import MemoryAnchorForm from '@/core/leisure/component/memoryAnchor/MemoryAnchorForm.vue'
	import type { MemoryAnchor } from '@/core/leisure/dto/response/MemoryAnchor.ts'
	import { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import { useMemoryAnchorCrud } from '@/core/leisure/api/memoryAnchorApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	// Paging/sorting/filtering state lives in the view's `useServerTable`; this component only
	// renders it and asks for a refetch.
	const { items } = defineProps<{
		items: MemoryAnchor[]
		loading: boolean
		itemsLength: number
		/** Whether the view\'s filter has anything set — tells "nothing matches" from "you have none" (F79). */
		filtered?: boolean
	}>()
	const emit = defineEmits<{ onLoadItems: []; onReload: []; onClearFilters: [] }>()
	const page = defineModel<number>('page', { required: true })
	const itemsPerPage = defineModel<number>('itemsPerPage', { required: true })
	const sortBy = defineModel<VSortItem[]>('sortBy', { required: true })
	const { deleteEntity } = useMemoryAnchorCrud()
	const { openDialog } = useDialog()
	const { t, locale } = useI18n()
	const router = useRouter()

	const monthFormatter = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }))

	const columns: TableColumn[] = [
		new TableColumn('periodKey', t('leisure.fields.anchorMonth')),
		new TableColumn('activity.name', t('leisure.fields.activity')),
		new TableColumn('rating', t('leisure.fields.rating')),
		new TableColumn('source', t('leisure.fields.source'), false),
		new TableColumn('highlightNote', t('leisure.fields.highlightNote'), false),
	]

	// Both destinations filter by activity name, which is the handle the two tables already share.
	function openSource(row: MemoryAnchor, routeName: 'leisureBucketList' | 'leisureBacklog') {
		void router.push({ name: routeName, query: { activityName: row.activity.name } })
	}

	function formatPeriod(row: MemoryAnchor) {
		return monthFormatter.value.format(new Date(row.anchorYear, row.anchorMonth - 1, 1))
	}

	function ratingColor(rating: number): string {
		if (rating >= 8) return 'successDark'
		if (rating >= 5) return 'primaryOutline'
		return 'warning'
	}

	async function openCreateDialog() {
		const result = await openDialog({
			component: MemoryAnchorForm,
			dialogProps: { title: t('leisure.memoryAnchors'), confirmBtnLabel: t('general.create') },
		})
		if (result) emit('onReload')
	}

	async function onEdit(item: MemoryAnchor) {
		const result = await openDialog({
			component: MemoryAnchorForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.memoryAnchors'), confirmBtnLabel: t('general.save') },
		})
		if (result) emit('onReload')
	}

	async function onDelete(item: MemoryAnchor) {
		await deleteEntity(item.id)
		emit('onReload')
	}
</script>
