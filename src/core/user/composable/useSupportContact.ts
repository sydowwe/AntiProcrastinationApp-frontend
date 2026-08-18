/**
 * The one place the support address is resolved. Both the About card and the legal pages hand the
 * reader a way to reach a human, and a privacy policy that names a different address than the
 * settings page is worse than one that names none — so the fallback lives here, not at two call
 * sites.
 */
export function useSupportContact() {
	const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@antiprocrastinationapp.dev'

	/** `mailto:` href for the support address, with the subject and body pre-filled when given. */
	function buildMailto(subject?: string, body?: string): string {
		const params = []
		if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
		if (body) params.push(`body=${encodeURIComponent(body)}`)
		return params.length > 0 ? `mailto:${supportEmail}?${params.join('&')}` : `mailto:${supportEmail}`
	}

	return { supportEmail, buildMailto }
}
