/**
 * The one rule the `CustomRange` wire contract adds beyond "send two dates" (B3).
 *
 * `endDate` is **inclusive**: 1–31 March is 31 days, and `date === endDate` is one day. Every count
 * derived from a custom range has to agree with that, so both the picker's pre-send guard and the
 * summary view's bucket-size choice read the span from here rather than each subtracting timestamps
 * their own way.
 */

/** A full calendar year, leap day included. Longer is a 400 from all four `summary/` endpoints. */
export const MAX_CUSTOM_RANGE_DAYS = 366

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Whole days from `from` to `to` counting both ends: same day → 1, next day → 2. Compared at local
 * midnight so a DST shift inside the range cannot round the count off by one.
 *
 * Returns 0 or less for an inverted range — the caller distinguishes that from "too long", because
 * the backend reports the two as different errors and the user needs to know which one they hit.
 */
export function inclusiveDaySpan(from: Date, to: Date): number {
	const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
	const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
	return Math.round((end - start) / MS_PER_DAY) + 1
}
