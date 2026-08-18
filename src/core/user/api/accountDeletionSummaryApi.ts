import { API } from '@/_common/axiosConfig.ts'
import { AccountDeletionSummary } from '@/core/user/dto/response/AccountDeletionSummary.ts'

export function useAccountDeletionSummaryApi() {
	async function fetchSummary(): Promise<AccountDeletionSummary> {
		// _silent: the card shows its own inline failure state instead of the interceptor's snackbar —
		// this is a cold-path disclosure almost nobody opens, not a user-initiated action.
		const r = await API.get('/user/account-deletion-summary', { _silent: true })
		return AccountDeletionSummary.fromJson(r.data)
	}

	return { fetchSummary }
}
