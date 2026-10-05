import { ref, watch, type Ref } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
import type { ActivityFilterFormResponse } from '@/core/activity/dto/response/ActivityFilterFormResponse.ts'
import { hasRoleCategoryTarget, type RoleCategoryTarget } from '@/core/activityTracking/dto/RoleCategoryTarget.ts'

/** `keepTarget` exists only while a role/category rule is loaded for edit — the form cannot create one (OP22). */
export type MappingMode = 'toActivity' | 'toIgnored' | 'keepTarget'

/** What `loadTarget()` reads off a Mappings row; both sources' responses carry it. */
interface MappingRowTarget extends RoleCategoryTarget {
	activity: ActivityFilterFormResponse | null
}

interface MappingRequestBase<TFilter> {
	isActive: boolean
	isIgnored: boolean | null
	activityId: number | null
	roleId: number | null
	categoryId: number | null

	updatePattern(filter: TFilter): void
	hasPattern(): boolean
}

export interface MappingSettingsConfig<TFilter, TRequest extends MappingRequestBase<TFilter>> {
	filterFactory(): TFilter
	requestFactory(): TRequest
	create(request: TRequest): Promise<unknown>
	update(id: number, request: TRequest): Promise<unknown>
}

/**
 * State and save/clear logic shared by the desktop and android mapping-settings views. `edit()` stays
 * in each view — the field lists genuinely differ per source.
 */
export function useMappingSettings<TFilter extends object, TRequest extends MappingRequestBase<TFilter>>(
	config: MappingSettingsConfig<TFilter, TRequest>,
) {
	const { showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()

	const filter = ref(config.filterFactory()) as Ref<TFilter>
	const formData = ref(new ActivityFormRequest())
	const mode = ref<MappingMode>('toActivity')
	const editedId = ref<number | null>(null)
	const request = ref(config.requestFactory()) as Ref<TRequest>
	/** Shown on the filter bar's pattern fields; the activity field marks itself through its own rule. */
	const patternError = ref<string | null>(null)
	/** The role/category target of the rule being edited, offered as *Keep* beside the two modes (OP22). */
	const keptTarget = ref<RoleCategoryTarget | null>(null)

	watch(filter, () => (patternError.value = null), { deep: true })

	/**
	 * Loads a Mappings row's target into the form. A role/category rule used to fall through to *To
	 * ignored*, so saving an edited pattern silently turned it into an ignore rule (OP22). It now opens on
	 * *Keep*, and becomes an activity or ignore rule only when the user picks that mode.
	 */
	function loadTarget(row: MappingRowTarget) {
		keptTarget.value = null
		if (row.activity) {
			formData.value.activityId = row.activity.id
			formData.value.roleId = row.activity.roleId
			formData.value.categoryId = row.activity.categoryId
			mode.value = 'toActivity'
		} else if (hasRoleCategoryTarget(row)) {
			keptTarget.value = {
				roleId: row.roleId,
				categoryId: row.categoryId,
				roleName: row.roleName,
				categoryName: row.categoryName,
			}
			mode.value = 'keepTarget'
		} else {
			mode.value = 'toIgnored'
		}
	}

	/**
	 * Resolves `true` once the rule is stored. The server takes exactly one target (F72): *To ignored* is
	 * `isIgnored = true` and no ids, *To activity* is the activity alone — the role and category in
	 * `formData` only narrow the picker, and sending them beside the activity is two targets. This form
	 * never creates the server's role/category target; *Keep* only re-sends the one an edited rule had.
	 */
	async function saved(): Promise<boolean> {
		const req = request.value
		req.updatePattern(filter.value)
		req.roleId = null
		req.categoryId = null
		if (mode.value === 'keepTarget' && keptTarget.value) {
			req.isIgnored = null
			req.activityId = null
			req.roleId = keptTarget.value.roleId
			req.categoryId = keptTarget.value.categoryId
		} else if (mode.value === 'toIgnored') {
			req.isIgnored = true
			req.activityId = null
		} else {
			req.isIgnored = null
			req.activityId = formData.value.activityId
		}

		patternError.value = req.hasPattern() ? null : t('activityTracking.settings.patternRequired')
		if (patternError.value || (mode.value === 'toActivity' && req.activityId == null)) return false

		try {
			if (editedId.value) {
				await config.update(editedId.value, req)
			} else {
				await config.create(req)
			}
		} catch (e) {
			// A response already has the interceptor's snackbar with the server's text; a second one here
			// would replace it. Only a request that never got an answer is left for this call site.
			if (axios.isAxiosError(e) && e.response === undefined && !axios.isCancel(e)) {
				showErrorSnackbar(t('activityTracking.settings.failedToSaveMapping'))
			}
			return false
		}
		// The edit is finished. Left set, a later *Save* would re-write this row from a fresh request and
		// reset its `isActive` to the default.
		editedId.value = null
		request.value = config.requestFactory()
		resetKeptTarget()
		return true
	}

	/** *Keep* belongs to the rule being edited; once the edit is over, the form is back to its two modes. */
	function resetKeptTarget() {
		keptTarget.value = null
		if (mode.value === 'keepTarget') mode.value = 'toActivity'
	}

	function clear() {
		resetKeptTarget()
		editedId.value = null
		filter.value = config.filterFactory()
		mode.value = 'toActivity'
		request.value = config.requestFactory()
		formData.value = new ActivityFormRequest()
		patternError.value = null
	}

	return { filter, formData, mode, editedId, request, patternError, keptTarget, loadTarget, saved, clear }
}
