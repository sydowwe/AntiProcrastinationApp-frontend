/**
 * What a quick edit does to the activity it started from: write over it, or leave it alone and create a
 * copy carrying the edits.
 *
 * The values are the PascalCase path segment of `PATCH /activity/{id}/{mode}`, so they are a wire
 * contract — do not recase them. This was three separately-declared `'Overwrite' | 'Clone'` inline
 * unions before.
 */
export enum QuickEditMode {
	OVERWRITE = 'Overwrite',
	CLONE = 'Clone',
}
