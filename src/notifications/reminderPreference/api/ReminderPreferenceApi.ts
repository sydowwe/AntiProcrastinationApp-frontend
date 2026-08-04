import { API } from '@/_common/axiosConfig.ts'
import { ReminderPreferenceResponse } from '@/core/notifications/reminderPreference/dto/response/ReminderPreferenceResponse.ts'
import { SetQuietHoursRequest } from '@/core/notifications/reminderPreference/dto/request/SetQuietHoursRequest.ts'
import type { UpsertReminderKindRequest } from '@/core/notifications/reminderPreference/dto/request/UpsertReminderKindRequest.ts'

const ENTITY = 'reminder-preference'

/** Loads the signed-in user's reminder preferences (per-kind settings + quiet-hours window). */
export async function fetchReminderPreferences(): Promise<ReminderPreferenceResponse> {
	const response = await API.get(`/${ENTITY}`)
	return ReminderPreferenceResponse.fromJson(response.data)
}

/**
 * Sets or replaces the quiet-hours window. Send both start and end (minutes-from-midnight, 0..1439).
 * The server returns 400 when only one is provided, a value is out of range, or start === end.
 */
export async function setQuietHours(startMinute: number, endMinute: number): Promise<void> {
	await API.put(`/${ENTITY}/quiet-hours`, new SetQuietHoursRequest(startMinute, endMinute))
}

/** Clears quiet hours entirely (both values null) — the user is then never deferred. */
export async function clearQuietHours(): Promise<void> {
	await API.put(`/${ENTITY}/quiet-hours`, new SetQuietHoursRequest(null, null))
}

/** Upserts one per-kind setting keyed by (ownerModule, kind). Returns no content on success. */
export async function upsertReminderKind(request: UpsertReminderKindRequest): Promise<void> {
	await API.put(`/${ENTITY}/kind`, request)
}
