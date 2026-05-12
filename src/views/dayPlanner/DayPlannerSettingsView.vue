<template>
	<div class="py-4 h-100 w-100 d-flex flex-column">
		<div class="d-flex align-center ga-3">
			<h2>Day Planner Settings</h2>
		</div>

		<VTabs
			v-model="activeTab"
			color="primaryOutline"
		>
			<VTab value="repeating">Repeating Tasks</VTab>
			<VTab value="reminders">Reminders</VTab>
			<VTab value="viewDefaults">View Defaults</VTab>
			<VTab value="skipReasons">Skip Reasons</VTab>
			<VTab value="calendarView">Calendar View</VTab>
		</VTabs>

		<VTabsWindow
			v-model="activeTab"
			class="flex-fill"
		>
			<VTabsWindowItem
				value="repeating"
				class="flex-fill d-flex flex-column ga-4 pt-3"
			>
				<BasicTable
					class="flex-fill"
					v-model="tasks"
					v-model:itemsPerPage="itemsPerPage"
					v-model:page="page"
					v-model:sortBy="sortBy"
					v-model:loading="loading"
					:columns
					:actions="tableActions"
					:itemsLength="tasks.length"
					:showSelect="false"
					@onAdd="taskDialog?.openAddDialog"
					@onLoadItems="loadItems"
				>
					<template #formattedColumn="{ id, key, value }">
						<template v-if="key === 'activity'">
							<div class="d-flex align-center ga-2">
								<VSheet
									:color="taskById(id)?.color || 'primary'"
									width="10"
									height="10"
									rounded="circle"
								/>
								{{ taskById(id)?.activity.name }}
							</div>
						</template>
						<template v-else-if="key === 'time'">
							{{ taskById(id)?.startTime.getString() }} – {{ taskById(id)?.endTime.getString() }}
						</template>
						<template v-else-if="key === 'recurrenceType'">
							<VChip
								size="small"
								:prependIcon="getRecurrenceTypeIcon(taskById(id)!.recurrenceType)"
								variant="tonal"
								color="primaryOutline"
							>
								{{ value }}
							</VChip>
						</template>
						<template v-else-if="key === 'isActive'">
							<VSwitch
								class="mx-auto pr-4"
								style="width: fit-content"
								:modelValue="value"
								color="successDark"
								hideDetails
								@update:modelValue="onToggleActive(taskById(id)!)"
							/>
						</template>
						<template v-else>{{ value ?? '—' }}</template>
					</template>
				</BasicTable>
			</VTabsWindowItem>

			<VTabsWindowItem
				value="reminders"
				class="pt-3"
			>
				<VCard
					variant="outlined"
					color="secondaryOutline"
					class="pa-4 d-flex flex-column ga-4"
					style="max-width: 480px"
				>
					<VSwitch
						v-model="settingsStore.remindersEnabled"
						label="Enable task reminders"
						color="successDark"
						hideDetails
					/>
					<div class="d-flex align-center ga-4">
						<span
							class="text-body-2"
							:class="{ 'text-disabled': !settingsStore.remindersEnabled }"
						>
							Remind me
						</span>
						<VNumberInput
							v-model="settingsStore.reminderMinutesBefore"
							:min="1"
							:max="60"
							:disabled="!settingsStore.remindersEnabled"
							hideDetails
							style="width: 140px"
							density="comfortable"
						/>
						<span
							class="text-body-2"
							:class="{ 'text-disabled': !settingsStore.remindersEnabled }"
						>
							minutes before each task
						</span>
					</div>
				</VCard>
			</VTabsWindowItem>

			<VTabsWindowItem
				value="viewDefaults"
				class="pt-3"
			>
				<VCard
					variant="outlined"
					color="secondaryOutline"
					class="pa-4 d-flex flex-column ga-2"
					style="max-width: 480px"
				>
					<VSwitch
						v-model="settingsStore.detailsPanelExpandedByDefault"
						label="Show details panel by default"
						color="successDark"
						hideDetails
					/>
					<VSwitch
						v-model="settingsStore.arrowKeyNavEnabled"
						label="Arrow key date navigation"
						color="successDark"
						hideDetails
					/>
					<div class="d-flex align-center ga-3 pt-1">
						<span class="text-body-2">Time slot size</span>
						<VBtnToggle
							v-model="settingsStore.slotDurationMinutes"
							mandatory
							color="primary"
							density="compact"
						>
							<VBtn :value="5">5 min</VBtn>
							<VBtn :value="10">10 min</VBtn>
							<VBtn :value="15">15 min</VBtn>
							<VBtn :value="30">30 min</VBtn>
						</VBtnToggle>
					</div>
				</VCard>
			</VTabsWindowItem>

			<VTabsWindowItem
				value="skipReasons"
				class="pt-3 d-flex flex-column ga-4"
				style="max-width: 480px"
			>
				<div
					v-if="settingsStore.predefinedSkipReasons.length"
					class="d-flex flex-wrap ga-2"
				>
					<VChip
						v-for="(reason, i) in settingsStore.predefinedSkipReasons"
						:key="reason"
						variant="tonal"
						color="secondaryOutline"
						closable
						@click:close="settingsStore.predefinedSkipReasons.splice(i, 1)"
					>
						{{ reason }}
					</VChip>
				</div>
				<p
					v-else
					class="text-body-2 text-disabled"
				>
					No predefined reasons yet. Add one below.
				</p>
				<div class="d-flex ga-2 align-center">
					<VTextField
						v-model="newSkipReason"
						label="New reason"
						hideDetails
						style="max-width: 300px"
						@keydown.enter="addSkipReason"
					/>
					<VBtn
						color="primary"
						:disabled="
							!newSkipReason.trim() || settingsStore.predefinedSkipReasons.includes(newSkipReason.trim())
						"
						@click="addSkipReason"
					>
						Add
					</VBtn>
				</div>
			</VTabsWindowItem>

			<VTabsWindowItem
				value="calendarView"
				class="pt-3"
			>
				<VCard
					variant="outlined"
					color="secondaryOutline"
					class="pa-4 d-flex flex-column ga-4"
					style="max-width: 480px"
				>
					<VIdAutocomplete
						v-model="settingsStore.defaultApplyTemplateId"
						:items="activeTemplates"
						label="Default template"
						clearable
						hideDetails
					/>
					<VSelect
						v-model="settingsStore.defaultConflictResolution"
						:items="conflictResolutionOptions"
						label="Default conflict resolution"
						hideDetails
					/>
					<VSwitch
						v-model="settingsStore.defaultApplyPreviewMode"
						label="Default to preview mode"
						color="successDark"
						hideDetails
					/>
				</VCard>
			</VTabsWindowItem>
		</VTabsWindow>
	</div>

	<RepeatingTaskDialog
		ref="taskDialog"
		@create="onCreate"
		@edit="onEdit"
	/>

	<MyDialog
		v-model="deleteDialog"
		title="Delete"
		text="Delete this repeating task?"
		confirmBtnColor="error"
		confirmBtnLabel="Delete"
		@confirmed="confirmDelete"
	/>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import BasicTable from '@/components/general/dataTable/BasicTable.vue'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import RepeatingTaskDialog from '@/components/dayPlanner/settings/RepeatingTaskDialog.vue'
	import { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import { TableAction } from '@/dtos/dto/TableAction.ts'
	import { VSortItem } from '@/dtos/dto/VSortItem.ts'
	import { useRepeatingPlannerTaskApi } from '@/api/taskPlanner/repeatingPlannerTaskApi.ts'
	import type { RepeatingPlannerTask } from '@/dtos/response/activityPlanning/RepeatingPlannerTask.ts'
	import type { RepeatingPlannerTaskRequest } from '@/dtos/request/activityPlanning/RepeatingPlannerTaskRequest.ts'
	import { getRecurrenceTypeIcon } from '@/dtos/enum/RecurrenceType.ts'
	import { useDayPlannerSettingsStore } from '@/stores/dayPlanner/dayPlannerSettingsStore.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'

	const { fetchAll, fetchById, createWithResponse, update, deleteEntity } = useRepeatingPlannerTaskApi()
	const { fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const settingsStore = useDayPlannerSettingsStore()
	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')
	const activeTemplates = ref<TaskPlannerDayTemplate[]>([])

	const tasks = ref<RepeatingPlannerTask[]>([])
	const taskDialog = ref<InstanceType<typeof RepeatingTaskDialog>>()
	const activeTab = ref('repeating')
	const newSkipReason = ref('')

	function addSkipReason() {
		const trimmed = newSkipReason.value.trim()
		if (!trimmed || settingsStore.predefinedSkipReasons.includes(trimmed)) return
		settingsStore.predefinedSkipReasons.push(trimmed)
		newSkipReason.value = ''
	}

	onMounted(async () => {
		await settingsStore.loadSettings()
		activeTemplates.value = (await fetchAllTemplates()).filter(t => t.isActive)
	})

	let saveTimer: ReturnType<typeof setTimeout> | undefined
	watch(
		() => [
			settingsStore.remindersEnabled,
			settingsStore.reminderMinutesBefore,
			settingsStore.detailsPanelExpandedByDefault,
			settingsStore.arrowKeyNavEnabled,
			[...settingsStore.predefinedSkipReasons],
			settingsStore.slotDurationMinutes,
			settingsStore.defaultApplyTemplateId,
			settingsStore.defaultConflictResolution,
			settingsStore.defaultApplyPreviewMode,
		],
		() => {
			if (!settingsStore.loaded) return
			clearTimeout(saveTimer)
			saveTimer = setTimeout(() => settingsStore.saveSettings(), 500)
		},
		{ deep: true },
	)
	const itemsPerPage = ref(25)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])
	const loading = ref(false)
	const deleteDialog = ref(false)
	const pendingDeleteId = ref<number | null>(null)

	const columns: TableColumn[] = [
		new TableColumn('activity', 'Activity', false),
		new TableColumn('time', 'Time', false),
		new TableColumn('recurrenceType', 'Recurrence', false),
		new TableColumn('isActive', 'Active', false),
	]

	const tableActions: TableAction[] = [
		new TableAction('edit', 'Edit', 'primaryOutline', 'tonal', 'pen', (item: RepeatingPlannerTask) =>
			taskDialog.value?.openEditDialog(item),
		),
		new TableAction('delete', 'Delete', 'secondaryOutline', 'tonal', 'trash', (item: RepeatingPlannerTask) => {
			pendingDeleteId.value = item.id
			deleteDialog.value = true
		}),
	]

	function taskById(id: number) {
		return tasks.value.find(t => t.id === id)
	}

	async function loadItems() {
		loading.value = true
		tasks.value = await fetchAll()
		loading.value = false
	}

	async function onCreate(req: RepeatingPlannerTaskRequest) {
		const created = await createWithResponse(req)
		tasks.value.push(created)
	}

	async function onEdit(id: number, req: RepeatingPlannerTaskRequest) {
		await update(id, req)
		const updated = await fetchById(id)
		const idx = tasks.value.findIndex(t => t.id === id)
		if (idx >= 0) tasks.value[idx] = updated
	}

	async function confirmDelete() {
		if (pendingDeleteId.value === null) return
		await deleteEntity(pendingDeleteId.value)
		tasks.value = tasks.value.filter(t => t.id !== pendingDeleteId.value)
		pendingDeleteId.value = null
	}

	async function onToggleActive(item: RepeatingPlannerTask) {
		const req: Partial<RepeatingPlannerTaskRequest> = { isActive: !item.isActive }
		await update(item.id, req as RepeatingPlannerTaskRequest)
		item.isActive = !item.isActive
	}
</script>
