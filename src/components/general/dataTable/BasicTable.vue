<template>
	<div class="h-100 w-100 d-flex flex-column">
		<DataTable
			v-model="items"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			:columns
			:items
			:itemsLength
			:loading
			:showExpand="showExpand ?? false"
			:showSelect="showSelect ?? true"
			:showActions
			@onLoadItems="emit('onLoadItems')"
		>
			<template #[`header.actions`]>
				<div
					v-if="showActionsHeader"
					class="d-flex justify-center align-center ga-2"
				>
					<VIconBtn
						icon="plus"
						width="40"
						height="36"
						variant="tonal"
						color="success"
						title="Pridať"
						@click="emit('onAdd')"
					>
						<v-icon size="18"></v-icon>
					</VIconBtn>
					<slot name="actionsHeader"></slot>
				</div>
			</template>

			<template #item="{ item, internalItem }">
				<VDataTableRow :item="internalItem">
					<template
						v-for="column in columns"
						:key="column.key"
						#[`item.${column.key}`]
					>
						<slot
							:id="item.id"
							:key="column.key"
							name="formattedColumn"
							:value="getColumnValue(item, column.key)"
						>
							{{ getColumnValue(item, column.key) }}
						</slot>
					</template>
					<template #[`item.actions`]>
						<VSheet class="px-2 d-flex align-center justify-center ga-2 h-100 w-100">
							<slot
								name="actions"
								:item="item"
							>
								<VIconBtn
									v-for="(action, i) in actions"
									:key="i"
									:icon="action.icon"
									:variant="action.variant"
									width="40"
									height="36"
									:color="action.color"
									:title="action.name"
									@click="action.onClick(item)"
								>
									<v-icon size="15"></v-icon>
								</VIconBtn>
								<slot
									:id="item.id"
									name="additionalActions"
								></slot>
							</slot>
						</VSheet>
					</template>
				</VDataTableRow>
			</template>

			<template #expanded-row="{ item, columns: expColumns, isExpanded, toggleExpand }">
				<slot
					name="expandedRow"
					:item="item"
					:expColumns="expColumns"
					:isExpanded="isExpanded"
					:toggleExpand="toggleExpand"
				></slot>
			</template>
			<template #bottom>
				<MyTableFooter
					v-model:itemsPerPage="itemsPerPage"
					v-model:page="page"
					:itemsLength
				>
					<template #append>
						<slot name="footer.append"></slot>
					</template>
				</MyTableFooter>
			</template>
		</DataTable>

		<MyDialog
			v-model="deleteDialog"
			title="Delete confirmation"
			:text="deleteConfirmationText"
			confirmBtnColor="error"
			@confirmed="emit('onDelete')"
		/>
	</div>
</template>
<script setup lang="ts" generic="TItem extends IIdResponse">
	import { computed, ref, watch } from 'vue'
	import { type IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
	import { TableAction } from '@/_common/dto/dto/table/TableAction.ts'
	import type { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
	import { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
	import MyTableFooter from '@/components/general/dataTable/MyTableFooter.vue'
	import DataTable from '@/components/general/dataTable/DataTable.vue'
	import { getNestedValue } from '@/_common/utils/helperMethods.ts'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import { useUserStore } from '@/_common/modules/user/store/authStore.ts'

	const {
		itemsLength,
		columns: columnsProp,
		actions: actionsProp,
		showActions = true,
		showActionsHeader = true,
		showExpand,
		showSelect,
		deleteConfirmationColumn,
	} = defineProps<{
		itemsLength: number
		columns: TableColumn[]
		actions?: TableAction[]
		showActions?: boolean
		showActionsHeader?: boolean
		showExpand?: boolean
		showSelect?: boolean
		deleteConfirmationColumn?: string
	}>()

	const emit = defineEmits<{
		(e: 'onAdd'): void
		(e: 'onDelete', item: TItem): void
		(e: 'onEdit', item: TItem): void
		(e: 'onLoadItems'): void
	}>()

	const items = defineModel<TItem[]>({ required: true })

	const itemsPerPage = defineModel<number>('itemsPerPage', { required: true })

	const page = defineModel<number>('page', { required: true })

	const sortBy = defineModel<VSortItem[]>('sortBy', { required: true })

	const loading = defineModel<boolean>('loading', { required: true })

	// The framework's getNestedValue returns `unknown` where the old local one returned `any`.
	// This component's `formattedColumn` slot has no framework counterpart (the framework's
	// BasicTable forwards `#item.<key>` instead), so keep the slot's value loosely typed until
	// step 7 reworks these tables.
	function getColumnValue(item: Record<string, unknown>, key: string): any {
		return getNestedValue(item, key)
	}

	const userStore = useUserStore()

	const actions = actionsProp ?? [
		new TableAction('edit', 'Upraviť', 'primaryOutline', 'tonal', 'pen', edit),
		new TableAction('delete', 'Vymazať', 'secondaryOutline', 'tonal', 'trash', del),
	]

	const columns = computed(() => columnsProp)

	const deleteDialog = ref(false)
	const deleteConfirmationText = ref<string | undefined>()

	watch(
		() => columnsProp,
		() => {
			if (!columnsProp[0]?.key) {
				return
			}
			sortBy.value.push(new VSortItem(props.columns[0]?.key, 'asc'))
		},
	)

	function edit(item: TItem) {
		emit('onEdit', item)
	}

	function del(item: TItem) {
		const name = deleteConfirmationColumn ? (item as Record<string, unknown>)[deleteConfirmationColumn] : item.id
		if (!userStore.currentUser.askBeforeDelete) {
			emit('onDelete', item)
			return
		}
		deleteDialog.value = true
		deleteConfirmationText.value = `Are you sure you want to delete ${name}?`
	}

	// onMounted(() => {
	// 	const perPageSelectObject = document.querySelector('');
	// 	console.log(perPageSelectObject)
	// })
</script>

<style>
	.v-data-table tr:not(.expanded-row) th:last-child {
		border-left: 1px solid #bbb !important;
	}

	.v-data-table table {
		border-bottom: 1px solid #bbb !important;
	}

	.v-data-table tr:not(.expanded-row) td:last-child {
		border-left: 1px solid #bbb !important;
	}

	.v-data-table .v-data-table__td--expanded-row {
		text-align: center;
	}
</style>
