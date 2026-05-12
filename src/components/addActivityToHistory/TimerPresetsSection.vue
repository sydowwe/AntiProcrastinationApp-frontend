<template>
	<div class="d-flex flex-column ga-4">
		<div class="d-flex ga-3 align-center">
			<h3 class="text-h6">Timer Presets</h3>
			<VBtn
				variant="tonal"
				:color="editMode ? 'secondaryOutline' : 'default'"
				:prependIcon="editMode ? 'check' : 'pen-to-square'"
				@click="toggleEditMode"
			>
				{{ editMode ? 'Done' : 'Edit' }}
			</VBtn>
		</div>

		<!-- Quick Times Section -->
		<div class="d-flex flex-column ga-3">
			<div class="d-flex ga-2 align-center">
				<h4 class="text-subtitle-1">Quick Times</h4>
				<VIconBtn
					v-if="editMode"
					icon="plus"
					variant="tonal"
					color="success"
					size="32"
					:disabled="!timeInputVisible"
					@click="openCreateDialog()"
				>
					<VIcon size="18"></VIcon>
				</VIconBtn>
			</div>
			<div
				v-if="timeOnlyPresets.length > 0"
				class="d-flex flex-wrap ga-2"
			>
				<VChip
					v-for="preset in timeOnlyPresets"
					:key="preset.id"
					:class="{ 'pr-4': editMode }"
					variant="tonal"
					color="primaryOutline"
					@click="editMode ? openEditDialog(preset) : applyPreset(preset)"
				>
					{{ preset.durationFormatted }}
					<template #close>
						<VIcon
							v-if="editMode"
							icon="pen-to-square"
							size="16"
							class="mr-2"
						></VIcon>
					</template>
				</VChip>
			</div>
			<div
				v-else
				class="text-textMuted text-body-2"
			>
				No presets yet
			</div>
		</div>

		<!-- Activity Presets Section -->
		<div
			v-if="activityPresetsVisible"
			class="d-flex flex-column ga-3"
		>
			<div class="d-flex ga-2 align-center">
				<h4 class="text-subtitle-1">Activity Presets</h4>
				<VIconBtn
					v-if="editMode"
					icon="plus"
					variant="tonal"
					color="success"
					size="32"
					:disabled="!timeInputVisible"
					@click="openCreateDialog(true)"
				>
					<VIcon size="18"></VIcon>
				</VIconBtn>
			</div>
			<div
				v-if="activityPresets.length > 0"
				class="d-flex flex-wrap ga-2"
			>
				<VChip
					v-for="preset in activityPresets"
					:key="preset.id"
					variant="tonal"
					color="secondaryOutline"
					@click="editMode ? openEditDialog(preset, true) : applyPreset(preset)"
				>
					{{ preset.durationFormatted }} · {{ preset.activity?.name }}
					<template #close>
						<VIcon
							v-if="editMode"
							icon="pen-to-square"
							size="16"
							class="mr-2"
						></VIcon>
					</template>
				</VChip>
			</div>
			<div
				v-else
				class="text-textMuted text-body-2"
			>
				No presets yet
			</div>
		</div>
	</div>

	<TimerPresetDialog
		ref="presetDialog"
		@created="onPresetChanged"
		@updated="onPresetChanged"
		@deleted="onPresetChanged"
	></TimerPresetDialog>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import type { TimerPreset } from '@/dtos/response/activityRecording/TimerPreset.ts'
	import { useTimerPresetCrud } from '@/api/activityHistory/timerPresetApi.ts'
	import TimerPresetDialog from '@/components/addActivityToHistory/TimerPresetDialog.vue'

	defineProps<{
		timeInputVisible: boolean
		activityPresetsVisible: boolean
	}>()

	const emit = defineEmits<{
		(e: 'applyPreset', preset: TimerPreset): void
	}>()

	const { fetchAll } = useTimerPresetCrud()

	const allPresets = ref<TimerPreset[]>([])
	const editMode = ref(false)
	const presetDialog = ref<InstanceType<typeof TimerPresetDialog>>()

	const timeOnlyPresets = computed(() => {
		return allPresets.value.filter(preset => !preset.isActivityPreset)
	})

	const activityPresets = computed(() => {
		return allPresets.value.filter(preset => preset.isActivityPreset)
	})

	onMounted(async function loadPresets() {
		await loadPresetsData()
	})

	async function loadPresetsData() {
		allPresets.value = await fetchAll()
		console.log(allPresets.value)
	}

	function applyPreset(preset: TimerPreset) {
		emit('applyPreset', preset)
	}

	function toggleEditMode() {
		editMode.value = !editMode.value
	}

	function openCreateDialog(isActivityMode: boolean = false) {
		presetDialog.value?.openAddDialog(isActivityMode)
	}

	function openEditDialog(preset: TimerPreset, isActivityMode: boolean = false) {
		presetDialog.value?.openEditDialog(preset, isActivityMode)
	}

	async function onPresetChanged() {
		await loadPresetsData()
	}
</script>
