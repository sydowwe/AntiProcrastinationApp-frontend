import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { createRequestState } from '@/_common/api/useRequestState.ts'
import type { ReminderDefinitionFilter } from '@/core/reminders/dto/request/ReminderDefinitionFilter.ts'
import type { ReminderKeyRequest } from '@/core/reminders/dto/request/ReminderKeyRequest.ts'
import { ReminderDefinitionGridResponse } from '@/core/reminders/dto/response/ReminderDefinitionGridResponse.ts'
import { ReminderDefinitionResponse } from '@/core/reminders/dto/response/ReminderDefinitionResponse.ts'

const ENTITY = 'reminder-definition'

export function useReminderDefinitionQuery() {
	const sharedState = createRequestState()
	const { fetchFilteredTable } = useFetchFilteredTable<ReminderDefinitionGridResponse, ReminderDefinitionFilter>({
		responseClass: ReminderDefinitionGridResponse,
		entityName: ENTITY,
		sharedState,
	})
	const query = useEntityQuery<ReminderDefinitionResponse>({
		entityName: ENTITY,
		responseClass: ReminderDefinitionResponse,
		sharedState,
	})
	return { ...query, fetchFilteredTable }
}

// ----- Lifecycle actions -----
// All three take the reminder key in the body, return no content, and are idempotent server-side.

/** Stops an Active reminder from firing; its next occurrence clears. */
export async function pauseReminder(key: ReminderKeyRequest): Promise<void> {
	await API.post(`/${ENTITY}/pause`, key)
}

/** Re-activates a Paused reminder; its next occurrence is recomputed server-side. */
export async function resumeReminder(key: ReminderKeyRequest): Promise<void> {
	await API.post(`/${ENTITY}/resume`, key)
}

/** Cancels a reminder; it becomes Cancelled and stops firing (terminal). */
export async function cancelReminder(key: ReminderKeyRequest): Promise<void> {
	await API.post(`/${ENTITY}/cancel`, key)
}
