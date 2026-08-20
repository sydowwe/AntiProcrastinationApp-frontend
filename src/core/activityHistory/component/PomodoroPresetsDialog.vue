<template>
	<MyDialog
		v-model="dialog"
		:hasConfirmBtn="false"
		:closeBtnText="$t('general.close')"
	>
		<template #header>
			<div class="px-6 mt-1 mb-4 d-flex ga-3 align-center">
				<h3 class="text-h6">{{ $t('history.timerPresetsTitle') }}</h3>
				<VBtn
					variant="tonal"
					:color="editMode ? 'secondaryOutline' : 'default'"
					:prependIcon="editMode ? 'check' : 'pen-to-square'"
					@click="toggleEditMode"
				>
					{{ editMode ? $t('general.done') : $t('general.edit') }}
				</VBtn>
				<VBtn
					color="successDark"
					@click="openCreateDialog"
				>
					{{ $t('general.create') }}
				</VBtn>
			</div>
		</template>

		<div
			v-if="presets.length > 0"
			class="d-flex flex-column ga-3"
		>
			<VCard
				v-for="preset in presets"
				:key="preset.id"
				variant="outlined"
				class="pa-4"
				:class="{ 'no-interaction': editMode }"
				:style="{ border: '1px solid rgba(256, 256, 256, 0.3)' }"
				:hover="!editMode"
				:ripple="!editMode"
				@click="!editMode ? selectPreset(preset) : undefined"
			>
				<VCardTitle class="text-h6 px-0 pt-0 pb-2 d-flex justify-space-between align-center">
					<span>{{ preset.name }}</span>
					<div
						v-if="editMode"
						class="d-flex ga-2"
					>
						<VIconBtn
							icon="pen-to-square"
							size="x-small"
							variant="tonal"
							@click.stop="openEditDialog(preset)"
						></VIconBtn>
						<VIconBtn
							icon="trash"
							size="x-small"
							variant="tonal"
							color="error"
							@click.stop="deletePreset(preset)"
						></VIconBtn>
					</div>
				</VCardTitle>
				<VCardText class="pa-0">
					<div class="d-flex flex-column ga-1">
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.focusTime') }}:</span>
							<span class="font-weight-medium">{{ preset.focusDurationFormatted }}</span>
						</div>
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.shortRestTime') }}:</span>
							<span class="font-weight-medium">{{ preset.shortBreakDurationFormatted }}</span>
						</div>
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.longRestTime') }}:</span>
							<span class="font-weight-medium">{{ preset.longBreakDurationFormatted }}</span>
						</div>
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">
								{{ $t('pomodoroTimer.numberOfFocusIntervalsInCycle') }}:
							</span>
							<span class="font-weight-medium">{{ preset.focusPeriodInCycleCount }}</span>
						</div>
						<div class="d-flex justify-space-between">
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.numberOfCycles') }}:</span>
							<span class="font-weight-medium">{{ preset.numberOfCycles }}</span>
						</div>
						<div
							v-if="preset.focusActivity"
							class="d-flex justify-space-between"
						>
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.focusActivity') }}:</span>
							<span class="font-weight-medium">{{ preset.focusActivity.name }}</span>
						</div>
						<div
							v-if="preset.restActivity"
							class="d-flex justify-space-between"
						>
							<span class="text-medium-emphasis">{{ $t('pomodoroTimer.restActivity') }}:</span>
							<span class="font-weight-medium">{{ preset.restActivity.name }}</span>
						</div>
					</div>
				</VCardText>
			</VCard>
		</div>
		<div
			v-else
			class="text-center text-textMuted"
		>
			{{ $t('history.noPresetsYet') }}
		</div>
	</MyDialog>

	<PomodoroPresetFormDialog
		ref="formDialog"
		@created="onPresetChanged"
		@updated="onPresetChanged"
		@deleted="onPresetChanged"
	></PomodoroPresetFormDialog>
</template>

<script setup lang="ts">
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import PomodoroPresetFormDialog from '@/core/activityHistory/component/PomodoroPresetFormDialog.vue'
	import { onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import type { PomodoroTimerPreset } from '@/core/activityHistory/dto/response/PomodoroTimerPreset.ts'
	import { usePomodoroTimerPresetCrud } from '@/core/activityHistory/api/pomodoroTimerPresetApi.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

	const emit = defineEmits<{
		select: [
			preset: {
				focusTime: Time
				shortRestTime: Time
				longRestTime: Time
				numberOfFocusPeriodsInCycle: number
				numberOfCycles: number
				focusActivityId: number | null
				restActivityId: number | null
			},
		]
	}>()
	const { t } = useI18n()
	const { confirm } = useDialog()

	const { fetchAll, deleteEntity } = usePomodoroTimerPresetCrud()

	const dialog = ref(false)
	const editMode = ref(false)
	const presets = ref<PomodoroTimerPreset[]>([])
	const formDialog = ref<InstanceType<typeof PomodoroPresetFormDialog>>()

	onMounted(async function loadPresets() {
		await loadPresetsData()
	})

	async function loadPresetsData() {
		presets.value = await fetchAll()
	}

	function open() {
		dialog.value = true
	}

	function toggleEditMode() {
		editMode.value = !editMode.value
	}

	function openCreateDialog() {
		formDialog.value?.openAddDialog()
	}

	function openEditDialog(preset: PomodoroTimerPreset) {
		formDialog.value?.openEditDialog(preset)
	}

	async function deletePreset(preset: PomodoroTimerPreset) {
		const confirmed = await confirm({
			text: t('history.confirmDeleteNamedPreset', { name: preset.name }),
			confirmBtnColor: 'error',
		})
		if (!confirmed) return

		await deleteEntity(preset.id)
		await loadPresetsData()
	}

	async function onPresetChanged() {
		await loadPresetsData()
	}

	function selectPreset(preset: PomodoroTimerPreset) {
		emit('select', {
			focusTime: Time.fromMinutes(preset.focusDuration),
			shortRestTime: Time.fromMinutes(preset.shortBreakDuration),
			longRestTime: Time.fromMinutes(preset.longBreakDuration),
			numberOfFocusPeriodsInCycle: preset.focusPeriodInCycleCount,
			numberOfCycles: preset.numberOfCycles,
			focusActivityId: preset.focusActivity?.id ?? null,
			restActivityId: preset.restActivity?.id ?? null,
		})
		dialog.value = false
	}

	defineExpose({ open })
</script>

<style scoped>
	.no-interaction {
		cursor: default !important;
		pointer-events: none;
	}

	.no-interaction :deep(.v-card__overlay) {
		display: none !important;
	}

	.no-interaction :deep(*) {
		pointer-events: auto;
	}
</style>
