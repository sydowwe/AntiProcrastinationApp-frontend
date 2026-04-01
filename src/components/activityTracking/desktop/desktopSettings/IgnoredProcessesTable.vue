<template>
	<VCard
		elevation="2"
		class="mt-6"
	>
		<VCardTitle class="pa-4 pb-2">Ignored Processes</VCardTitle>
		<VCardText>
			<div class="d-flex align-center ga-2 mb-3">
				<VTextField
					v-model="filterProcessKey"
					label="Filter by process key"
					clearable
					density="compact"
					hideDetails
					@update:modelValue="onFilterChange"
					@keyup.enter="loadItems"
				/>
			</div>

			<BasicTable
				v-model="items"
				v-model:itemsPerPage="itemsPerPage"
				v-model:page="page"
				v-model:sortBy="sortBy"
				v-model:loading="loading"
				:columns
				:itemsLength="totalItems"
				:actions="tableActions"
				:showSelect="false"
				@onAdd="openCreate"
				@onLoadItems="loadItems"
			>
				<template #formattedColumn="{ key, value }">
					<VChip
						v-if="key === 'titleContainsToggle'"
						:color="value ? 'success' : 'warning'"
						size="small"
						variant="tonal"
					>
						{{ value ? 'Contains' : 'Not contains' }}
					</VChip>
					<span v-else>{{ value }}</span>
				</template>
			</BasicTable>
		</VCardText>
	</VCard>

	<!-- Create/Edit Dialog -->
	<VDialog
		v-model="formDialog"
		maxWidth="500"
	>
		<VCard>
			<VCardTitle class="pa-4">{{ editingItem ? 'Edit Ignored Process' : 'Add Ignored Process' }}</VCardTitle>
			<VCardText>
				<VForm ref="form">
					<div class="d-flex flex-column ga-3">
						<VAutocomplete
							v-model="formData.processKey"
							:items="distinctProcesses"
							itemTitle="title"
							itemValue="value"
							label="Process"
							:rules="[v => !!v || 'Required']"
							density="compact"
							clearable
							:loading="loadingProcesses"
							noDataText="No processes found"
						/>
						<VTextField
							v-model="formData.titleContains"
							label="Title"
							density="compact"
							clearable
							hideDetails
						/>
						<VSwitch
							v-model="formData.titleContainsToggle"
							:label="
								formData.titleContainsToggle
									? 'Ignored when title contains the text'
									: 'Ignored when title does not contain the text'
							"
							color="primary"
							density="compact"
							hideDetails
						/>
					</div>
				</VForm>
			</VCardText>
			<VCardActions class="pa-4">
				<VSpacer />
				<VBtn
					variant="text"
					@click="formDialog = false"
				>
					Cancel
				</VBtn>
				<VBtn
					color="primary"
					:loading="saving"
					@click="save"
				>
					Save
				</VBtn>
			</VCardActions>
		</VCard>
	</VDialog>

	<!-- Delete Confirmation Dialog -->
	<VDialog
		v-model="deleteDialog"
		maxWidth="400"
	>
		<VCard>
			<VCardTitle class="pa-4">Confirm Delete</VCardTitle>
			<VCardText>
				Delete ignored process
				<strong>{{ deletingItem?.processKey }}</strong>
				?
			</VCardText>
			<VCardActions class="pa-4">
				<VSpacer />
				<VBtn
					variant="text"
					@click="deleteDialog = false"
				>
					Cancel
				</VBtn>
				<VBtn
					color="error"
					:loading="deleting"
					@click="confirmDelete"
				>
					Delete
				</VBtn>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { API } from '@/plugins/axiosConfig.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import type { TitleValueObject } from '@/dtos/dto/TitleValueObject.ts'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import { TableAction } from '@/dtos/dto/TableAction.ts'
	import type { VSortItem } from '@/dtos/dto/VSortItem.ts'

	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	interface IgnoredProcessItem {
		id: number
		processKey: string
		titleContainsToggle: boolean
		titleContains: string | null
		activityTrackingDesktopSettingsId: number
	}

	interface FormData {
		processKey: string
		titleContainsToggle: boolean
		titleContains: string | null
	}

	const columns = [
		new TableColumn('processKey', 'Process Key'),
		new TableColumn('titleContainsToggle', 'Condition', false),
		new TableColumn('titleContains', 'Title', false),
	]

	const tableActions = [
		new TableAction('edit', 'Edit', 'primaryOutline', 'tonal', 'pen', openEdit),
		new TableAction('delete', 'Delete', 'secondaryOutline', 'tonal', 'trash', openDelete),
	]

	const items = ref<IgnoredProcessItem[]>([])
	const totalItems = ref(0)
	const loading = ref(false)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])
	const filterProcessKey = ref('')

	const distinctProcesses = ref<TitleValueObject[]>([])
	const loadingProcesses = ref(false)

	const formDialog = ref(false)
	const form = ref<any>(null)
	const editingItem = ref<IgnoredProcessItem | null>(null)
	const saving = ref(false)

	const deleteDialog = ref(false)
	const deletingItem = ref<IgnoredProcessItem | null>(null)
	const deleting = ref(false)

	function emptyForm(): FormData {
		return {
			processKey: '',
			titleContainsToggle: true,
			titleContains: null,
		}
	}

	const formData = ref<FormData>(emptyForm())

	let filterTimer: ReturnType<typeof setTimeout> | null = null

	function onFilterChange() {
		if (filterTimer) clearTimeout(filterTimer)
		filterTimer = setTimeout(() => {
			page.value = 1
			loadItems()
		}, 400)
	}

	async function loadItems() {
		loading.value = true
		try {
			const response = await API.post(
				'/activity-tracking/desktop/settings/activity-tracking-settings-desktop-ignored-process/filtered-table',
				{
					page: page.value,
					itemsPerPage: itemsPerPage.value,
					sortBy: 'id',
					useFilter: true,
					filter: {
						processKey: filterProcessKey.value ?? '',
					},
				},
			)
			items.value = response.data.items
			totalItems.value = response.data.total
		} catch {
			showErrorSnackbar('Failed to load ignored processes')
		} finally {
			loading.value = false
		}
	}

	async function fetchDistinctProcesses() {
		loadingProcesses.value = true
		try {
			const response = await API.get('/activity-tracking/desktop/distinct-processes')
			distinctProcesses.value = response.data
		} catch {
			showErrorSnackbar('Failed to load processes')
		} finally {
			loadingProcesses.value = false
		}
	}

	function openCreate() {
		editingItem.value = null
		formData.value = emptyForm()
		formDialog.value = true
		fetchDistinctProcesses()
	}

	function openEdit(item: IgnoredProcessItem) {
		editingItem.value = item
		formData.value = {
			processKey: item.processKey,
			titleContainsToggle: item.titleContainsToggle,
			titleContains: item.titleContains,
		}
		formDialog.value = true
		fetchDistinctProcesses()
	}

	async function save() {
		const valid = await form.value?.validate()
		if (!valid?.valid) return

		saving.value = true
		const body = { ...formData.value }
		try {
			if (editingItem.value) {
				await API.put(`/activity-tracking/desktop/settings/ignored-processes/${editingItem.value.id}`, body)
				showSuccessSnackbar('Ignored process updated')
			} else {
				await API.post('/activity-tracking/desktop/settings/ignored-processes', body)
				showSuccessSnackbar('Ignored process created')
			}
			formDialog.value = false
			await loadItems()
		} catch {
			showErrorSnackbar('Failed to save ignored process')
		} finally {
			saving.value = false
		}
	}

	function openDelete(item: IgnoredProcessItem) {
		deletingItem.value = item
		deleteDialog.value = true
	}

	async function confirmDelete() {
		if (!deletingItem.value) return
		deleting.value = true
		try {
			await API.delete(`/activity-tracking/desktop/settings/ignored-processes/${deletingItem.value.id}`)
			showSuccessSnackbar('Ignored process deleted')
			deleteDialog.value = false
			await loadItems()
		} catch {
			showErrorSnackbar('Failed to delete ignored process')
		} finally {
			deleting.value = false
		}
	}
</script>
