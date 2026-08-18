import { useUserStore } from '@/_common/modules/user/store/authStore.ts'

// Per-user state that lives in this browser and nowhere else was originally written under global
// keys, so two accounts on one machine shared it: sign out, sign in as someone else, and you
// inherited their dismissed onboarding hints and their template ordering. This stops that bleed.
//
// It does not move anything to the server. B5 has since moved the two items that needed it —
// pinned templates and the weekly routine review dismissal now round-trip through the API — and the
// remainder (template card ordering, the two onboarding hints, leisure suggestion history, which is
// deferred to `prompts/leisure/backend/D1-backend.md`) are staying local on purpose.
//
// `prompts/user/P4-device-local-state.md` owns the triage; the inventory it produced is in the
// summary of that work, not duplicated here.

/**
 * Used while no user is loaded. Keys written under it are not migrated onto a real account later:
 * we do not know whose they are, and guessing is how you hand one user another's state.
 */
const ANONYMOUS_SCOPE = 'anon'

function currentScope(): string {
	// `User.id` defaults to 0 on a fresh `new User()`, which is what an unhydrated store holds.
	const id = useUserStore().currentUser.id
	return id > 0 ? String(id) : ANONYMOUS_SCOPE
}

/**
 * `'templateSectionOrder'` → `'templateSectionOrder::u42'`.
 *
 * Call this at read/write time, never at module scope: the store may not be hydrated when a module
 * is first imported, and a key captured then would be the anonymous one for the rest of the session.
 */
export function userScopedKey(name: string): string {
	return `${name}::u${currentScope()}`
}

/**
 * Moves a pre-namespacing value onto the current user's key, once.
 *
 * The un-namespaced key has no owner recorded, so this assumes it belongs to whoever is signed in
 * when it is first seen — true on the overwhelmingly common single-account device, and the
 * alternative is throwing the value away. Losing a user's pinned templates to a key rename would be
 * a self-inflicted version of the bug being fixed here.
 *
 * Idempotent: once the legacy key is gone, this does nothing. If the scoped key already holds a
 * value, the legacy one is discarded rather than overwriting newer state.
 */
export function migrateLegacyKey(legacyName: string): void {
	if (currentScope() === ANONYMOUS_SCOPE) return
	try {
		const legacyValue = localStorage.getItem(legacyName)
		if (legacyValue === null) return
		const scopedKey = userScopedKey(legacyName)
		if (localStorage.getItem(scopedKey) === null) {
			localStorage.setItem(scopedKey, legacyValue)
		}
		localStorage.removeItem(legacyName)
	} catch {
		// Storage can be unavailable (private mode, disabled cookies). The state is a convenience in
		// every case that uses this; losing it is not worth an error the user cannot act on.
	}
}

/** Reads a user-scoped key, migrating the legacy un-namespaced one on first call. */
export function readUserScoped(name: string): string | null {
	migrateLegacyKey(name)
	try {
		return localStorage.getItem(userScopedKey(name))
	} catch {
		return null
	}
}

export function writeUserScoped(name: string, value: string): void {
	try {
		localStorage.setItem(userScopedKey(name), value)
	} catch {
		// See `migrateLegacyKey`.
	}
}
