// App-local gap filler: the framework's `_common/utils/helperMethods.ts` has no equivalent.
// Pending upstream request (MIGRATION-PLAN.md §7) — delete this file once it lands there.
export function hasObjectChanged<T>(original: T, modified: T): boolean {
	return JSON.stringify(original) !== JSON.stringify(modified)
}
