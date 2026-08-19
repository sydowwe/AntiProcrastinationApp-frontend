import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import { useActivityOptionsStore } from '@/core/activity/store/activityOptionsStore.ts'

/**
 * The public way to read the role/category/activity select options. Backed by `activityOptionsStore`,
 * so the lists are fetched once per session instead of once per mount and every consumer sees the
 * same copy.
 *
 * `roleOptions` / `categoryOptions` / `activityOptions` are the store's own refs — bind those in a
 * template rather than copying the result of a fetch into a local `ref`, or the component stops
 * seeing later updates (a role created elsewhere, a deleted activity disappearing).
 *
 * The `fetch*` functions are kept for consumers that only need to trigger the load; they resolve to
 * the cached value when there is one and share the in-flight request otherwise.
 */
export function useActivitySelectOptions() {
	const store = useActivityOptionsStore()
	const { roleOptions, categoryOptions, activityOptions } = storeToRefs(store)

	return {
		roleOptions,
		categoryOptions,
		activityOptions,
		rolesLoading: computed(() => store.isLoading('role')),
		categoriesLoading: computed(() => store.isLoading('category')),
		activitiesLoading: computed(() => store.isLoading('activity')),
		fetchRoleSelectOptions: () => store.ensureOptions('role'),
		fetchCategorySelectOptions: () => store.ensureOptions('category'),
		fetchActivitySelectOptions: () => store.ensureOptions('activity'),
		/** Show a just-created option immediately, in every mounted picker, without a round trip. */
		addRoleOption: (option: SelectOption) => store.addOption('role', option),
		addCategoryOption: (option: SelectOption) => store.addOption('category', option),
		addActivityOption: (option: SelectOption) => store.addOption('activity', option),
	}
}
