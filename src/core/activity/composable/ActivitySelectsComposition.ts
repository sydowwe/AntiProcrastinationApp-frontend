// Pure derivation over the combination matrix. Fetching it is `activityOptionsStore.ensureCombinations`
// — it is cached, so no request lives here any more.
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import type { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'
import type { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
import { ActivityFormSelectOptions } from '@/core/activity/dto/response/ActivityFormSelectOptions.ts'

export function uniqueOptions(options: SelectOption[]) {
	return Array.from(new Map(options.map(option => [option.id, option])).values())
}

/**
 * Narrows the matrix down to the options each dropdown should offer, by filtering on every *other*
 * field's current value.
 *
 * Only role, category and activity participate. The matrix's `taskPriorityOption` and
 * `routineTimePeriodOption` are a hard-coded null on every source the backend serves, so a predicate
 * on either could only ever be false: with a priority selected, `null?.id === 3` excluded every row
 * and all three dropdowns emptied at once. Those two lists are their own lookups now and
 * `useActivitySelectionFormState` fills them in — they never narrowed anything anyway, since they were
 * derived from the unfiltered matrix.
 */
export function filterActivityFormSelectOptions(
	allOptionsCombinations: ActivitySelectOptionCombination[],
	formData: ActivityFormRequest,
) {
	// Filter combinations excluding each field to get options for that field
	const combinationsForRole = allOptionsCombinations.filter(
		combination =>
			(!formData.activityId || combination.id === formData.activityId) &&
			(!formData.categoryId || combination.categoryOption?.id === formData.categoryId),
	)

	const combinationsForCategory = allOptionsCombinations.filter(
		combination =>
			(!formData.activityId || combination.id === formData.activityId) &&
			(!formData.roleId || combination.roleOption.id === formData.roleId),
	)

	const combinationsForActivity = allOptionsCombinations.filter(
		combination =>
			(!formData.roleId || combination.roleOption.id === formData.roleId) &&
			(!formData.categoryId || combination.categoryOption?.id === formData.categoryId),
	)

	const filteredOptions = new ActivityFormSelectOptions()
	filteredOptions.activityOptions = uniqueOptions(
		combinationsForActivity.map(combination => new SelectOption(combination.id, combination.text)),
	)
	filteredOptions.roleOptions = uniqueOptions(combinationsForRole.map(combination => combination.roleOption))
	filteredOptions.categoryOptions = uniqueOptions(
		combinationsForCategory
			.map(combination => combination.categoryOption)
			.filter((option): option is SelectOption => option !== null),
	)
	return filteredOptions
}

/**
 * An activity set from outside the dropdown — a timer preset, a preselection — wins over the role and
 * category narrowing it contradicts, so this clears whichever of the two excludes it.
 *
 * Without it the two narrow each other out: the role hides the activity, the activity hides the role,
 * and `pruneSelectionsMissingFromOptions` clears both in one pass, so the form is left with neither.
 * An id the matrix does not know is left alone — there is nothing to judge the narrowing against.
 */
export function dropNarrowingThatExcludes(
	allOptionsCombinations: ActivitySelectOptionCombination[],
	formData: ActivityFormRequest,
	activityId: number | null,
) {
	if (activityId == null) return
	const combinations = allOptionsCombinations.filter(combination => combination.id === activityId)
	if (combinations.length === 0) return
	if (formData.roleId != null && !combinations.some(combination => combination.roleOption.id === formData.roleId)) {
		formData.roleId = null
	}
	if (
		formData.categoryId != null &&
		!combinations.some(combination => combination.categoryOption?.id === formData.categoryId)
	) {
		formData.categoryId = null
	}
}
