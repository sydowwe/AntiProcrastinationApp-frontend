import { API } from '@/_common/axiosConfig.ts'
import { WelcomeBack } from '@/core/home/dto/response/WelcomeBack.ts'
import { FreshStartResult } from '@/core/home/dto/response/FreshStartResult.ts'
import type { ApplyFreshStartRequest } from '@/core/home/dto/request/ApplyFreshStartRequest.ts'

/**
 * The welcome-back card (FO5). The routes are the host's, not a module's: the card spans to-dos, the
 * planner, routines and notifications, so it lives on the page that shows all of them.
 */
export function useWelcomeBackApi() {
	const url = 'welcome-back'

	/**
	 * The card, or null when there is none (204). Silent: the card is a bonus on top of home, so a failure,
	 * or an API that does not have the route yet, must leave the page exactly as it was, with no snackbar.
	 */
	async function fetchCard(): Promise<WelcomeBack | null> {
		const response = await API.get(url, { _silent: true })
		return response.status === 204 || !response.data ? null : WelcomeBack.fromJson(response.data)
	}

	/** One save. 409 when no card is open (already answered elsewhere, dismissed or lapsed). */
	async function applyFreshStart(request: ApplyFreshStartRequest): Promise<FreshStartResult> {
		const { data } = await API.post(`${url}/fresh-start`, request)
		return FreshStartResult.fromJson(data)
	}

	/** Puts back every row still as the fresh start left it, and reopens the card. 404 once spent or expired. */
	async function undoFreshStart(undoToken: string): Promise<void> {
		await API.post(`${url}/fresh-start/undo`, { undoToken })
	}

	/** Closes the card and changes nothing on it. */
	async function dismiss(): Promise<void> {
		await API.post(`${url}/dismiss`)
	}

	return { fetchCard, applyFreshStart, undoFreshStart, dismiss }
}
