import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePlannerSettingsApi } from '@/core/dayPlanner/api/plannerSettingsApi.ts'
import { UserPlannerSettingsRequest } from '@/core/dayPlanner/dto/request/UserPlannerSettingsRequest.ts'
import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
import type { AutoReminderMode } from '@/core/dayPlanner/dto/enum/AutoReminderMode.ts'
import {
	DEFAULT_AUTO_REMINDER_MIN_IMPORTANCE,
	DEFAULT_AUTO_REMINDER_MODE,
} from '@/core/dayPlanner/dto/response/UserPlannerSettings.ts'

export const useDayPlannerSettingsStore = defineStore(
	'dayPlannerSettings',
	() => {
		const { fetchSettings, updateSettings } = usePlannerSettingsApi()

		// B2, answered: these two stay here, and they are NOT a duplicate off switch. The dispatcher
		// (`ReminderScanJobHandler`) reads reminder preferences only; it never reads planner settings.
		// Server-side, `remindersEnabled` + `reminderMinutesBefore` do exactly one thing — prefill the
		// lead time when a task-linked reminder is created without one — so `remindersEnabled: false`
		// suppresses the prefill, never the reminder. Client-side they also gate `useTaskReminders`,
		// the in-tab nudge, which is the only thing most users see them do. The only kill switch for
		// delivery is the ("Portal", "PersonalReminder") row on the reminder preferences page, and it
		// covers every personal reminder, not just planner ones. Lead time deliberately does not move:
		// it is already per-reminder (`Reminder.leadOffsetsMinutes`) one level down.
		// See `prompts/user/backend/B2-preference-ownership.md` for the full answer.
		const remindersEnabled = ref(true)
		const reminderMinutesBefore = ref(10)
		// P1-03: which new blocks the server gives a reminder of their own, at `reminderMinutesBefore`. Unlike the
		// two above this does reach delivery — it creates real reminders — and `remindersEnabled` does not gate it.
		const autoReminderMode = ref<AutoReminderMode>(DEFAULT_AUTO_REMINDER_MODE)
		const autoReminderMinImportance = ref(DEFAULT_AUTO_REMINDER_MIN_IMPORTANCE)
		const detailsPanelExpandedByDefault = ref(true)
		const arrowKeyNavEnabled = ref(true)
		const predefinedSkipReasons = ref<string[]>([])
		const slotDurationMinutes = ref(10)
		const defaultApplyTemplateId = ref<number | null>(null)
		const defaultConflictResolution = ref<ApplyTemplateConflictResolution>(ApplyTemplateConflictResolution.Ignore)
		const defaultApplyPreviewMode = ref(true)
		const loaded = ref(false)
		/**
		 * The request the server holds, as last loaded or saved. `saveSettings()` sends nothing when the fields
		 * still match it. The settings view's debounced watcher sees `loadSettings()` assign every field, and by
		 * the time it runs `loaded` is already true, so every visit to the page used to PUT back exactly what it
		 * had just read. That was an extra write on each visit, and one that could overwrite a change made
		 * elsewhere in between (another tab, or a test setting a row through the API) with the page's copy.
		 */
		let savedRequestJson: string | null = null

		// In-memory only (see the `persist: false` note at the bottom). Guards against re-fetching on
		// every navigation between the planner views; does not survive a reload, which is the point.
		async function loadSettings() {
			if (loaded.value) return
			const settings = await fetchSettings()
			remindersEnabled.value = settings.remindersEnabled
			reminderMinutesBefore.value = settings.reminderMinutesBefore
			autoReminderMode.value = settings.autoReminderMode
			autoReminderMinImportance.value = settings.autoReminderMinImportance
			detailsPanelExpandedByDefault.value = settings.detailsPanelExpandedByDefault
			arrowKeyNavEnabled.value = settings.arrowKeyNavEnabled
			predefinedSkipReasons.value = settings.predefinedSkipReasons
			slotDurationMinutes.value = settings.slotDurationMinutes
			defaultApplyTemplateId.value = settings.defaultApplyTemplateId
			defaultConflictResolution.value = settings.defaultConflictResolution
			defaultApplyPreviewMode.value = settings.defaultApplyPreviewMode
			savedRequestJson = JSON.stringify(currentRequest())
			loaded.value = true
		}

		/**
		 * Forces the next `loadSettings()` call to fetch again, instead of short-circuiting on the
		 * previous account's cached values. Does not reset the field values themselves — every reader
		 * awaits `loadSettings()` before using them, so the fetch overwrites them before anything reads
		 * the stale copy.
		 */
		function resetSettings() {
			loaded.value = false
		}

		function currentRequest(): UserPlannerSettingsRequest {
			return new UserPlannerSettingsRequest(
				remindersEnabled.value,
				reminderMinutesBefore.value,
				autoReminderMode.value,
				autoReminderMinImportance.value,
				detailsPanelExpandedByDefault.value,
				arrowKeyNavEnabled.value,
				// A copy, so the snapshot does not alias the live array.
				[...predefinedSkipReasons.value],
				slotDurationMinutes.value,
				defaultApplyTemplateId.value,
				defaultConflictResolution.value,
				defaultApplyPreviewMode.value,
			)
		}

		/** Sends the fields, unless they are what the server already holds (see `savedRequestJson`). */
		async function saveSettings() {
			const request = currentRequest()
			const json = JSON.stringify(request)
			if (json === savedRequestJson) return
			await updateSettings(request)
			// Only after the PUT succeeded, so a failed save is retried by the next change rather than forgotten.
			savedRequestJson = json
		}

		return {
			remindersEnabled,
			reminderMinutesBefore,
			autoReminderMode,
			autoReminderMinImportance,
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
			resetSettings,
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
	//   3. Nothing cleared it on logout (`_common/nav/useLogout.ts` only resets the user store), so a
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
