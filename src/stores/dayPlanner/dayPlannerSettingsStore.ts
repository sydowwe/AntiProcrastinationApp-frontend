import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePlannerSettingsApi } from '@/api/plannerSettingsApi.ts'
import { UserPlannerSettingsRequest } from '@/dtos/request/UserPlannerSettingsRequest.ts'
import { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'

export const useDayPlannerSettingsStore = defineStore('dayPlannerSettings', () => {
	const { fetchSettings, updateSettings } = usePlannerSettingsApi()

	const remindersEnabled = ref(true)
	const reminderMinutesBefore = ref(10)
	const detailsPanelExpandedByDefault = ref(true)
	const arrowKeyNavEnabled = ref(true)
	const predefinedSkipReasons = ref<string[]>([])
	const slotDurationMinutes = ref(10)
	const defaultApplyTemplateId = ref<number | null>(null)
	const defaultConflictResolution = ref<ApplyTemplateConflictResolution>(ApplyTemplateConflictResolution.Ignore)
	const defaultApplyPreviewMode = ref(true)
	const loaded = ref(false)

	async function loadSettings() {
		if (loaded.value) return
		const settings = await fetchSettings()
		remindersEnabled.value = settings.remindersEnabled
		reminderMinutesBefore.value = settings.reminderMinutesBefore
		detailsPanelExpandedByDefault.value = settings.detailsPanelExpandedByDefault
		arrowKeyNavEnabled.value = settings.arrowKeyNavEnabled
		predefinedSkipReasons.value = settings.predefinedSkipReasons
		slotDurationMinutes.value = settings.slotDurationMinutes
		defaultApplyTemplateId.value = settings.defaultApplyTemplateId
		defaultConflictResolution.value = settings.defaultConflictResolution
		defaultApplyPreviewMode.value = settings.defaultApplyPreviewMode
		loaded.value = true
	}

	async function saveSettings() {
		await updateSettings(
			new UserPlannerSettingsRequest(
				remindersEnabled.value,
				reminderMinutesBefore.value,
				detailsPanelExpandedByDefault.value,
				arrowKeyNavEnabled.value,
				predefinedSkipReasons.value,
				slotDurationMinutes.value,
				defaultApplyTemplateId.value,
				defaultConflictResolution.value,
				defaultApplyPreviewMode.value,
			),
		)
	}

	return {
		remindersEnabled,
		reminderMinutesBefore,
		detailsPanelExpandedByDefault,
		arrowKeyNavEnabled,
		predefinedSkipReasons,
		slotDurationMinutes,
		defaultApplyTemplateId,
		defaultConflictResolution,
		defaultApplyPreviewMode,
		loaded,
		loadSettings,
		saveSettings,
	}
})
