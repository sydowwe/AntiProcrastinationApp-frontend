import { watch } from 'vue'

/**
 * The framework `ActionBar`'s root class. Matching on it is the only way to answer "is focus inside
 * the bar that is about to leave" without a ref, and a ref is not available: `ActionBar`'s root is a
 * `<Transition>`, which renders no element of its own.
 */
const ACTION_BAR_SELECTOR = '.action-bar'

/**
 * Puts focus back where it came from when a floating action bar goes away.
 *
 * Every bar in this module appears on a selection and disappears when the selection is cleared —
 * and the usual way to clear it is the bar's own Cancel button. When that button unmounts under the
 * user's focus the browser parks focus on `<body>`, which for a keyboard user means being dropped
 * back at the top of the document with no idea where the grid went. It is invisible with a mouse,
 * which is why it survived: nothing on screen changes.
 *
 * The element to return to is captured when the bar *appears*, because that is the last moment the
 * originating control (a task block, a calendar day, a toolbar toggle) is known to have focus.
 *
 * Focus is only moved if the bar actually holds it. A user who tabbed away, or who cleared the
 * selection by clicking the grid, keeps whatever focus they had.
 *
 * The move happens synchronously, while the bar is still in the DOM. Waiting for the element to
 * disappear does not work: `ActionBar` leaves through a 0.3s transition, so a tick after the bar is
 * hidden its Cancel button is still mounted and still focused, and focus only lands on `<body>` long
 * after any `nextTick` has run.
 */
export function useActionBarFocusReturn(
	isShown: () => boolean,
	getFallback?: () => HTMLElement | null | undefined,
): void {
	let returnTarget: HTMLElement | null = null

	watch(isShown, (shown, wasShown) => {
		if (shown) {
			const active = document.activeElement
			returnTarget = active instanceof HTMLElement && active !== document.body ? active : null
			return
		}
		if (!wasShown) return

		const active = document.activeElement
		const isInBar = active instanceof HTMLElement && active.closest(ACTION_BAR_SELECTOR) !== null
		// Focus is inside the leaving bar, or already lost. Anything else is somewhere the user put
		// it deliberately, so leave it alone.
		if (!isInBar && active !== null && active !== document.body) return

		const target = returnTarget?.isConnected ? returnTarget : getFallback?.()
		target?.focus()
		returnTarget = null
	})
}
