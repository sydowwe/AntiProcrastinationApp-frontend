/** The two legal documents this app publishes. Both render through `LegalDocument.vue`. */
export type LegalDocumentKey = 'terms' | 'privacy'

/**
 * Route names, so the pages can cross-link by name rather than by path — the paths are also
 * reachable under an alias (see `user.routes.ts`) and a name survives an alias change.
 */
export const LEGAL_ROUTE_NAMES: Record<LegalDocumentKey, string> = {
	terms: 'legalTerms',
	privacy: 'legalPrivacy',
}

/**
 * The date each document last changed, ISO `YYYY-MM-DD`, rendered as "last updated" at the top of
 * the page. **Bump the entry whenever you edit that document's `user.legal.*.sections` copy** — the
 * page states the version is the one in effect, which is only true if this date tracks the text.
 * Kept here rather than in the views so both documents can move independently of each other.
 */
export const LEGAL_LAST_UPDATED: Record<LegalDocumentKey, string> = {
	terms: '2026-08-18',
	privacy: '2026-08-18',
}
