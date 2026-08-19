import { ref, type Ref } from 'vue'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'

export type MappingMode = 'toActivity' | 'toIgnored'

interface MappingRequestBase<TFilter> {
	activityId: number | null
	roleId: number | null
	categoryId: number | null

	updatePattern(filter: TFilter): void
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
export function useMappingSettings<TFilter, TRequest extends MappingRequestBase<TFilter>>(
	config: MappingSettingsConfig<TFilter, TRequest>,
) {
	const { showErrorSnackbar } = useSnackbar()

	const filter = ref(config.filterFactory()) as Ref<TFilter>
	const formData = ref(new ActivityFormRequest())
	const mode = ref<MappingMode>('toActivity')
	const editedId = ref<number | null>(null)
	const request = ref(config.requestFactory()) as Ref<TRequest>

	async function saved() {
		request.value.updatePattern(filter.value)
		request.value.activityId = formData.value.activityId
		request.value.roleId = formData.value.roleId
		request.value.categoryId = formData.value.categoryId
		try {
			if (editedId.value) {
				await config.update(editedId.value, request.value)
			} else {
				await config.create(request.value)
			}
			request.value = config.requestFactory()
		} catch {
			showErrorSnackbar('Failed to save mapping')
		}
	}

	function clear() {
		editedId.value = null
		filter.value = config.filterFactory()
		mode.value = 'toActivity'
		request.value = config.requestFactory()
		formData.value = new ActivityFormRequest()
	}

	return { filter, formData, mode, editedId, request, saved, clear }
}
