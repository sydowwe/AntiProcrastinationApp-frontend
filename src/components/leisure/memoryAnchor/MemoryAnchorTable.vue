<template>
	<BasicTable
		v-model="items"
		v-model:itemsPerPage="itemsPerPage"
		v-model:page="page"
		v-model:sortBy="sortBy"
		v-model:loading="loading"
		:columns
		:itemsLength
		showActions
		@onLoadItems="loadItems"
		@onAdd="openCreateDialog"
		@onEdit="onEdit"
		@onDelete="onDelete"
	>
		<template #formattedColumn="{ key, value, id }">
			<template v-if="key === 'periodKey'">
				<span>{{ formatPeriod(id as number) }}</span>
			</template>
			<template v-else-if="key === 'rating'">
				<VChip
					:color="ratingColor(value as number)"
					size="small"
				>
					{{ value }}/10
				</VChip>
			</template>
			<template v-else>{{ value ?? '—' }}</template>
		</template>
		<template #actions="{ item }">
			<VChip
				v-if="(item as MemoryAnchor).hasBucketList"
				size="x-small"
				color="primaryOutline"
				class="mr-1"
			>
				{{ $t('leisure.anchorSourceBucketList') }}
			</VChip>
			<VChip
				v-else-if="(item as MemoryAnchor).hasBacklog && (item as MemoryAnchor).backlogIsOneTime"
				size="x-small"
				color="secondaryOutline"
				class="mr-1"
			>
				{{ $t('leisure.anchorSourceBacklog') }}
			</VChip>
		</template>
	</BasicTable>
</template>

<script setup lang="ts">
	import { ref, watch, computed } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import MemoryAnchorForm from '@/components/leisure/memoryAnchor/MemoryAnchorForm.vue'
	import type { MemoryAnchor } from '@/dtos/response/leisure/MemoryAnchor.ts'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import type { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { FilteredTableRequest } from '@/dtos/request/base/FilteredTableRequest.ts'
	import type { MemoryAnchorFilter } from '@/dtos/request/leisure/MemoryAnchorFilter.ts'
	import { useMemoryAnchorCrud } from '@/api/leisure/memoryAnchorApi.ts'
	import { useDialog } from '@/composables/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	const { filter } = defineProps<{ filter: MemoryAnchorFilter }>()

	const { fetchFilteredTable, deleteEntity } = useMemoryAnchorCrud()
	const { openDialog } = useDialog()
	const { t, locale } = useI18n()
	const loading = ref(false)

	const items = ref<MemoryAnchor[]>([])
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

	const monthFormatter = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }))

	const columns: TableColumn[] = [
		new TableColumn('periodKey', t('leisure.fields.anchorMonth')),
		new TableColumn('activity.name', t('leisure.fields.activity')),
		new TableColumn('rating', t('leisure.fields.rating')),
		new TableColumn('highlightNote', t('leisure.fields.highlightNote'), false),
	]

	function formatPeriod(rowId: number) {
		const row = items.value.find(i => i.id === rowId)
		if (!row) return '—'
		return monthFormatter.value.format(new Date(row.anchorYear, row.anchorMonth - 1, 1))
	}

	function ratingColor(rating: number): string {
		if (rating >= 8) return 'successDark'
		if (rating >= 5) return 'primaryOutline'
		return 'warning'
	}

	watch(
		() => filter,
		() => {
			page.value = 1
			loadItems()
		},
	)

	async function loadItems() {
		const request = new FilteredTableRequest<MemoryAnchorFilter>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			true,
			filter,
		)
		loading.value = true
		try {
			const result = await fetchFilteredTable(request)
			items.value = result.items
			itemsLength.value = result.itemsCount
		} finally {
			loading.value = false
		}
	}

	async function openCreateDialog() {
		const result = await openDialog({
			component: MemoryAnchorForm,
			dialogProps: { title: t('leisure.memoryAnchors'), confirmBtnLabel: t('general.create') },
		})
		if (result) await loadItems()
	}

	async function onEdit(item: MemoryAnchor) {
		const result = await openDialog({
			component: MemoryAnchorForm,
			componentProps: { entityToEdit: item },
			dialogProps: { title: t('leisure.memoryAnchors'), confirmBtnLabel: t('general.save') },
		})
		if (result) await loadItems()
	}

	async function onDelete(item: MemoryAnchor) {
		await deleteEntity(item.id)
		await loadItems()
	}
</script>
