import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Dashboard toggles that fire on every visit — a persisted preference fits better than a URL query
 * param nobody would share. sessionStorage is enough: it only needs to survive navigating away and
 * back, not closing the browser. The persist plugin is opt-in, so the third argument is what makes
 * that true — without it the toggles reset on every return to `/`.
 */
export const useHomeUiStore = defineStore(
	'homeUi',
	() => {
		const hideDoneTodoList = ref(true)
		const hideDoneRoutine = ref(true)

		return { hideDoneTodoList, hideDoneRoutine }
	},
	{ persist: { storage: sessionStorage } },
)
