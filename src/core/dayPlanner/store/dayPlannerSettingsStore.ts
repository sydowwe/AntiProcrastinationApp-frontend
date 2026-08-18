import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePlannerSettingsApi } from '@/core/dayPlanner/api/plannerSettingsApi.ts'
import { UserPlannerSettingsRequest } from '@/core/dayPlanner/dto/request/UserPlannerSettingsRequest.ts'
import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'

export const useDayPlannerSettingsStore = defineStore(
	'dayPlannerSettings',
	() => {
		const { fetchSettings, updateSettings } = usePlannerSettingsApi()

		// TODO(B2): these two are the only fields here that fail CLAUDE.md's "Where a preference lives"
		// rule. `remindersEnabled` duplicates the framework's per-`(ownerModule, kind)` `enabled` row
		// (`_common/modules/notifications/reminderPreference/`), so planner reminders currently have two
		// independent off switches that disagree. Moving them is a contract change, not a refactor —
		// see `prompts/user/backend/B2-preference-ownership.md`.
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

		// In-memory only (see the `persist: false` note at the bottom). Guards against re-fetching on
		// every navigation between the planner views; does not survive a reload, which is the point.
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
		// Explicit for the same reason as dayPlannerStore — the framework's Pinia setup is opt-in.
	},
	// NOT persisted, deliberately. These are server-owned preferences, and caching them in
	// sessionStorage cached `loaded: true` along with them, which broke three things:
	//
	//   1. A reload restored `loaded: true`, so `loadSettings()` short-circuited and the tab never
	//      re-fetched for the rest of its session — a preference changed anywhere else never arrived.
	//   2. sessionStorage is per-tab, so a second tab fetched fresh while the first served a copy
	//      frozen at its own first load.
	//   3. Nothing clears it on logout (`_common/nav/useLogout.ts` only resets the user store), so a
	//      second sign-in in the same tab read the *previous* user's planner settings — and the
	//      debounced watcher in `DayPlannerSettingsView.vue` would then write all nine fields back to
	//      the new user's account, `defaultApplyTemplateId` included: an FK to a template they do not
	//      own.
	//
	// Nothing rendered from the cache anyway: all three entry points `await loadSettings()` in
	// `onMounted` before reading a value (`PlannerCalendarView.vue`, `DayPlannerView.vue`,
	// `DayPlannerSettingsView.vue`), so dropping it costs exactly one GET per full page load and
	// in-SPA navigation still short-circuits on the in-memory `loaded` flag.
	{ persist: false },
)
