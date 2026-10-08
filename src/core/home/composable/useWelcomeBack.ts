import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useNotifications } from '@/_common/modules/notifications/composable/useNotifications.ts'
import { useWelcomeBackApi } from '@/core/home/api/welcomeBackApi.ts'
import type { WelcomeBack } from '@/core/home/dto/response/WelcomeBack.ts'
import type { ApplyFreshStartRequest } from '@/core/home/dto/request/ApplyFreshStartRequest.ts'
import { notifyTodoItemsChanged, useDashboardRefresh } from '@/core/home/composable/useDashboardRefresh.ts'

/**
 * The welcome-back card (FO5): whether there is one, and its three ways out — start fresh, leave
 * everything as it is, and undo a fresh start from the snackbar.
 *
 * The server owns the card. It opens it on the first request after four days or more away, so the card
 * subscribes to the dashboard's refresh triggers: a tab left open over a holiday finds its card when the
 * tab is looked at again, not only on the next full page load.
 *
 * Must be called from a setup context.
 */
export function useWelcomeBack() {
	const { t } = useI18n()
	const { showSnackbar, showSuccessSnackbar } = useSnackbar()
	const { loadNotifications } = useNotifications()
	const { fetchCard, applyFreshStart, undoFreshStart, dismiss: dismissCard } = useWelcomeBackApi()

	const card = ref<WelcomeBack | null>(null)
	const applying = ref(false)

	async function load() {
		try {
			card.value = await fetchCard()
		} catch {
			// Silent by design (see fetchCard): no card is the safe reading of any failure.
			card.value = null
		}
	}

	useDashboardRefresh('home:welcomeBack', { load, refresh: load, onDayChange: false })

	/**
	 * The fresh start changed rows that three other widgets and the bell are showing. The to-do widget and
	 * today's plan listen for to-do changes; the bell is re-read only if it was touched.
	 */
	function afterChange(notificationsChanged: boolean) {
		notifyTodoItemsChanged()
		if (notificationsChanged) void loadNotifications()
	}

	async function startFresh(request: ApplyFreshStartRequest) {
		if (applying.value) return
		applying.value = true
		let result
		try {
			result = await applyFreshStart(request)
		} catch {
			// The interceptor has reported it. A 409 means the card is gone already; re-read rather than guess.
			await load()
			return
		} finally {
			applying.value = false
		}
		card.value = null
		const notificationsChanged = result.notificationsMarkedRead > 0
		// The toast before the refreshes: a widget whose re-read fails queues its own error toast, and the one
		// carrying *Undo* must not wait behind it.
		if (result.changedAnything) {
			const token = result.undoToken
			showSnackbar(t('home.welcomeBack.applied'), {
				color: 'success',
				actionLabel: t('general.undo'),
				actionCallback: () => void undo(token, notificationsChanged),
			})
		}
		afterChange(notificationsChanged)
	}

	async function undo(token: string, notificationsChanged: boolean) {
		try {
			await undoFreshStart(token)
		} catch {
			// Reported by the interceptor: expired, already spent, or offline. Nothing changed.
			return
		}
		showSuccessSnackbar(t('home.welcomeBack.undone'))
		afterChange(notificationsChanged)
		await load()
	}

	/** Closes the card for good. Optimistic: the card goes at once, and comes back only if the server says no. */
	async function dismiss() {
		card.value = null
		try {
			await dismissCard()
		} catch {
			await load()
		}
	}

	return { card, applying, startFresh, dismiss }
}
