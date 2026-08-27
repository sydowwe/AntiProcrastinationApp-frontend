import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import { useActivityOptionsStore } from '@/core/activity/store/activityOptionsStore.ts'

/**
 * The public way to read the role/category/activity select options. Backed by `activityOptionsStore`,
 * so the lists are fetched once per session instead of once per mount and every consumer sees the
 * same copy.
 *
 * **Loading is automatic and no consumer writes a fetch of its own.** The store exposes
 * `ensureLoaded()`, and `createAppPinia()`'s plugin calls that on store creation — the framework
 * convention exists precisely so components do not each call it in `onMounted`, which is how these
 * consumers drifted into fetching different subsets behind different local loading flags. `App.vue`
 * instantiates the store at boot, so on a normal page load the lists are already there by the time a
 * picker mounts; read `rolesLoading` and friends for the window where they are not.
 *
 * `roleOptions` / `categoryOptions` / `activityOptions` are the store's own refs — bind those in a
 * template rather than copying them into a local `ref`, or the component stops seeing later updates
 * (a role created elsewhere, a deleted activity disappearing).
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
		/** Show a just-created option immediately, in every mounted picker, without a round trip. */
		addRoleOption: (option: SelectOption) => store.addOption('role', option),
		addCategoryOption: (option: SelectOption) => store.addOption('category', option),
		addActivityOption: (option: SelectOption) => store.addOption('activity', option),
	}
}
