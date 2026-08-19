import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import type { Ref } from 'vue'
import type { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
import { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
import { filterActivityFormSelectOptions } from '@/core/activity/composable/ActivitySelectsComposition.ts'
import {
	orderActivityOptionsByRecency,
	pruneRecencyToKnownActivities,
	recordActivitySelection,
} from '@/core/activity/composable/useActivityRecency.ts'
import { useActivityOptionsStore } from '@/core/activity/store/activityOptionsStore.ts'
import { ActivityFormSelectOptions } from '@/core/activity/dto/response/ActivityFormSelectOptions.ts'
import { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'
import { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import type { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'

export function useActivitySelectionFormState(
	formData: Ref<ActivityFormRequest>,
	selectedActivityId: Ref<number | null>,
	selection: Ref<ActivitySelection | null>,
	loading: Ref<boolean>,
	selectOptionsSource: ActivityOptionsSource,
	/**
	 * Whether the caller renders the "from to-do list" / "from routine to-do" fields. When it does not,
	 * the priority and period lookups are never displayed, so they are not fetched — that keeps the
	 * to-do and planner dialogs at the single combination request A7 got them down to.
	 */
	includeToDoListFields = true,
) {
	const optionsStore = useActivityOptionsStore()

	// `ensureCombinations` hands back a copy, which matters here: `onActivityCreated` pushes a row it
	// synthesises from what the form knows, and that row must not leak into the shared cache — the
	// server decides which combinations actually exist.
	const allOptionsCombinations = ref<ActivitySelectOptionCombination[]>([])
	const filteredOptions = ref(new ActivityFormSelectOptions())
	const optionsLoaded = ref(false)
	// How many of the leading `filteredOptions.activityOptions` came from the recency list. The picker
	// draws its group heading from this; 0 means the list is in plain alphabetical order.
	const recentActivityCount = ref(0)
	/** Whether this source knows of any activity at all, before the role/category narrowing. */
	const hasAnyActivities = computed(() => allOptionsCombinations.value.length > 0)

	// `formData.activityId` is the single source of truth for the selected activity; the `activityId`
	// model mirrors it so a call site can bind whichever of the two it owns. The storage used to be
	// either/or, keyed off `isFilter`, and every call site that bound the other one silently got
	// nothing: the desktop mappings editor, the history panel's activity filter and the pomodoro rest
	// form were all wired to a value that was never written.
	const activityIdModel = computed({
		get: () => formData.value.activityId,
		set: (value: number | null) => {
			formData.value.activityId = value
			selectedActivityId.value = value
		},
	})

	// Reconcile the two at setup: an explicitly bound `activityId` wins, otherwise adopt whatever
	// `formData` came in carrying.
	if (selectedActivityId.value != null) {
		formData.value.activityId = selectedActivityId.value
	} else {
		selectedActivityId.value = formData.value.activityId
	}

	watch(selectedActivityId, value => {
		if (formData.value.activityId !== value) {
			formData.value.activityId = value
		}
	})

	function nameOf(options: SelectOption[], id: number | null) {
		if (id == null) return ''
		return options.find(option => option.id === id)?.text ?? ''
	}

	// Names are display data derived from the loaded options, so there is a window after setup in which
	// they are all ''. Report `null` for that window instead — a consumer reading on mount can tell
	// "not loaded yet" from "nothing selected".
	watchEffect(() => {
		if (!optionsLoaded.value) {
			selection.value = null
			return
		}
		const options = filteredOptions.value
		const data = formData.value
		selection.value = new ActivitySelection(
			data.activityId,
			nameOf(options.activityOptions, data.activityId),
			data.roleId,
			nameOf(options.roleOptions, data.roleId),
			data.categoryId,
			nameOf(options.categoryOptions, data.categoryId),
			data.taskPriorityId,
			nameOf(options.taskPriorityOptions, data.taskPriorityId),
			data.routineTimePeriodId,
			nameOf(options.routineTimePeriodOptions, data.routineTimePeriodId),
		)
	})

	function refreshOptions() {
		const options = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value)
		// Recency ordering is applied after the narrowing, not before: a recent activity that the
		// selected role or category excludes must not reappear at the top of a list it is filtered out
		// of. The role scope is the one the form currently has selected.
		const ordered = orderActivityOptionsByRecency(options.activityOptions, formData.value.roleId)
		options.activityOptions = ordered.options
		recentActivityCount.value = ordered.recentCount
		// These two are plain lookups rather than anything the matrix narrows — they used to be read off
		// `taskPriorityOption` / `routineTimePeriodOption`, which the backend has always sent as null, so
		// both dropdowns were permanently empty and both names in `selection` permanently ''.
		options.taskPriorityOptions = optionsStore.taskPriorityOptions
		options.routineTimePeriodOptions = optionsStore.routineTimePeriodOptions
		filteredOptions.value = options
		// Before the options are in, every list is empty and pruning would clear a preselection the
		// parent passed in (an edited history record, a timer preset) before it ever had a chance to
		// match.
		if (!optionsLoaded.value) return
		pruneSelectionsMissingFromOptions()
	}

	/**
	 * The user chose an activity, as opposed to the form adopting one. Only user choices feed the
	 * recency list — a preselection restored from an edited record or a timer preset is not a pick,
	 * and pruning writing `null` is not one either.
	 */
	function commitActivitySelection(activityId: number | null) {
		if (activityId == null) return
		recordActivitySelection(activityId, formData.value.roleId)
		refreshOptions()
	}

	function pruneSelectionsMissingFromOptions() {
		if (
			activityIdModel.value != null &&
			!filteredOptions.value.activityOptions.some(option => option.id === activityIdModel.value)
		) {
			activityIdModel.value = null
		}
		if (
			formData.value.roleId != null &&
			!filteredOptions.value.roleOptions.some(option => option.id === formData.value.roleId)
		) {
			formData.value.roleId = null
		}
		if (
			formData.value.categoryId != null &&
			!filteredOptions.value.categoryOptions.some(option => option.id === formData.value.categoryId)
		) {
			formData.value.categoryId = null
		}
	}

	/**
	 * A secondary lookup: skipped when its field is not rendered, and its failure is swallowed. Losing
	 * the priority list must not empty the role, category and activity pickers alongside it — that is
	 * the failure mode the matrix's dead priority predicates already had.
	 */
	function ensureSecondaryOptions(kind: 'taskPriority' | 'routineTimePeriod'): Promise<SelectOption[]> {
		if (!includeToDoListFields) return Promise.resolve([])
		return optionsStore.ensureOptions(kind).catch(() => [])
	}

	onMounted(async () => {
		loading.value = true
		try {
			// In parallel, and all cached: the priority/period lookups are small and shared, so the extra
			// two requests happen at most once a session.
			const [combinations] = await Promise.all([
				optionsStore.ensureCombinations(selectOptionsSource),
				ensureSecondaryOptions('taskPriority'),
				ensureSecondaryOptions('routineTimePeriod'),
			])
			allOptionsCombinations.value = combinations
			optionsLoaded.value = true
			// Only `ALL` sees every activity. The narrower sources are subsets, so pruning against one
			// of them would delete recency entries that are still valid everywhere else.
			if (selectOptionsSource === ActivityOptionsSource.ALL) {
				pruneRecencyToKnownActivities(allOptionsCombinations.value.map(combination => combination.id))
			}
		} catch {
			allOptionsCombinations.value = []
		} finally {
			refreshOptions()
			loading.value = false
		}
	})

	watch(
		formData,
		newValue => {
			if (selectedActivityId.value !== newValue.activityId) {
				selectedActivityId.value = newValue.activityId
			}
			refreshOptions()
		},
		{ deep: true, immediate: true },
	)

	watch(
		() => formData.value.isFromToDoList,
		newValue => {
			if (!newValue) formData.value.taskPriorityId = null
		},
	)

	watch(
		() => formData.value.isFromRoutineToDoList,
		newValue => {
			if (!newValue) formData.value.routineTimePeriodId = null
		},
	)

	function onActivityCreated(request: ActivityRequest, createdId: number) {
		// Push the new activity into the *unfiltered* combinations, not into the filtered list: any later
		// change to the form re-derives the filtered list from these, and an option that only ever
		// existed in the derived copy vanishes again on the next keystroke.
		const roleOption = filteredOptions.value.roleOptions.find(option => option.id === request.roleId)
		const categoryOption = filteredOptions.value.categoryOptions.find(option => option.id === request.categoryId)
		allOptionsCombinations.value.push(
			new ActivitySelectOptionCombination(
				createdId,
				request.name,
				roleOption ?? new SelectOption(request.roleId ?? 0, ''),
				categoryOption ?? null,
			),
		)
		activityIdModel.value = createdId
		// Creating an activity from the picker is a pick — the user wanted this one, right now.
		commitActivitySelection(createdId)
	}

	return {
		filteredOptions,
		activityIdModel,
		recentActivityCount,
		hasAnyActivities,
		commitActivitySelection,
		onActivityCreated,
	}
}
