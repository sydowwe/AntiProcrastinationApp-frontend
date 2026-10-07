/**
 * What the re-plan's apply does with a block it had no room for today (FO4). Every such block is decided
 * inside the action, never parked as a list for later.
 *
 * - `tomorrow`: moved to the next day at the same time of day, and counted as a postponement.
 * - `skip`: skipped with the built-in reason `noTime`.
 */
export enum ReplanWontFitResolution {
	Tomorrow = 'tomorrow',
	Skip = 'skip',
}
