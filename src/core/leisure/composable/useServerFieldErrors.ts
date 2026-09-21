import { ref, type Ref } from 'vue'
import axios from 'axios'
import { extractServerFieldError } from '@/_common/axiosConfig.ts'

/**
 * Routes a FastEndpoints 400 (`{ errors: { propertyName: [...] } }`) onto the form field it names.
 *
 * The leisure create validators reject things the client rules cannot see — an activity that already
 * has a profile, a lookup id another account owns, an anchor onto an unprofiled activity — and their
 * message names the field exactly. Without this the only feedback was the interceptor's generic
 * snackbar, and the dialog sat open with nothing visibly wrong (`_fix-queue.md` F77).
 *
 * Usage: bind `serverErrors.<field>` to each field's `errorMessages`, call `clearServerErrors()`
 * before `form.validate()` (a stale message would fail it — the server re-decides on every submit),
 * and `applyServerError(e)` in the submit's `catch`.
 */
export function useServerFieldErrors<TField extends string>(fields: readonly TField[]) {
	const serverErrors = ref<Partial<Record<TField, string>>>({}) as Ref<Partial<Record<TField, string>>>

	function clearServerErrors() {
		serverErrors.value = {}
	}

	/** True when at least one message landed on a field; false for anything that is not a field-shaped 400. */
	function applyServerError(error: unknown): boolean {
		const next: Partial<Record<TField, string>> = {}
		if (axios.isAxiosError(error)) {
			for (const field of fields) {
				const message = extractServerFieldError(error, field)
				if (message) next[field] = message
			}
		}
		serverErrors.value = next
		return Object.keys(next).length > 0
	}

	return { serverErrors, clearServerErrors, applyServerError }
}
