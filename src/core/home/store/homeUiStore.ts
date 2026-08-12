import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Dashboard toggles that fire on every visit — a persisted preference fits better than a URL query
 * param nobody would share. sessionStorage (the app default) is enough: it only needs to survive
 * navigating away and back, not closing the browser.
 */
export const useHomeUiStore = defineStore('homeUi', () => {
	const hideDoneTodoList = ref(true)
	const hideDoneRoutine = ref(true)

	return { hideDoneTodoList, hideDoneRoutine }
})
