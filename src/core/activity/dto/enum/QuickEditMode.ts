/**
 * What a quick edit does to the activity it started from: write over it, or leave it alone and create a
 * copy carrying the edits.
 *
 * A client-side discriminator only — it never reaches the wire. The two modes are two different
 * endpoints with different verbs and response shapes (`PUT /activity/{id}/quick-edit` → 204,
 * `POST /activity/{id}/clone` → 200 with the new id), and `useQuickCreateActivity.quickEditActivity`
 * dispatches on it. The values used to be interpolated into a `PATCH /activity/{id}/{mode}` path that
 * the server had already renamed, so every quick edit 404'd (F74) — do not route on them again.
 */
export enum QuickEditMode {
	OVERWRITE = 'Overwrite',
	CLONE = 'Clone',
}
