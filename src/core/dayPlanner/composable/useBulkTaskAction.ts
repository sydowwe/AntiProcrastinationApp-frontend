import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import type { BatchOperationResponse } from '@/core/dayPlanner/dto/response/BatchOperationResult.ts'

export interface BulkActionMessages {
	/** Error key, rendered with `{succeeded}`, `{total}` and `{failed}` when at least one item failed. */
	partialKey: string
	/** Success key, rendered as a plural with `{count}`. */
	successKey: string
}

export interface RunBulkOptions<TValue> extends BulkActionMessages {
	/**
	 * Runs once every operation has settled and before the snackbar, so local state (selection,
	 * counters, the task list) is already consistent with what the message is about to claim.
	 */
	afterSettled?: (results: PromiseSettledResult<TValue>[]) => void
}

/**
 * The shared tail of every bulk task operation: count the failures, then show either the partial
 * message or the pluralized success one. The six call sites in `DayPlannerView` and
 * `PlannerCalendarView` had drifted apart once already — three counted locally, three read the
 * batch endpoint's own counts — so both shapes live here.
 */
export function useBulkTaskAction() {
	const { t } = useI18n()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()

	function report(
		outcome: { succeeded: number; total: number; failed: number; successCount: number },
		{ partialKey, successKey }: BulkActionMessages,
	) {
		if (outcome.failed > 0) {
			showErrorSnackbar(
				t(partialKey, { succeeded: outcome.succeeded, total: outcome.total, failed: outcome.failed }),
			)
		} else {
			showSuccessSnackbar(t(successKey, { count: outcome.successCount }, outcome.successCount))
		}
	}

	/** Client-side fan-out: one request per id, nothing aborts on the first failure. */
	async function runBulk<TId, TValue>(
		ids: TId[],
		op: (id: TId) => Promise<TValue>,
		options: RunBulkOptions<TValue>,
	): Promise<PromiseSettledResult<TValue>[]> {
		const results = await Promise.allSettled(ids.map(id => op(id)))
		options.afterSettled?.(results)
		const failed = results.filter(r => r.status === 'rejected').length
		report(
			{ succeeded: results.length - failed, total: results.length, failed, successCount: results.length },
			options,
		)
		return results
	}

	/**
	 * Server-side fan-out: a batch endpoint already reported per-day outcomes. `successCount` stays
	 * explicit because the success message counts the days the user selected, which is not
	 * necessarily the number of rows the endpoint returned.
	 */
	function reportBatchOutcome(
		response: BatchOperationResponse,
		{ successCount, ...messages }: BulkActionMessages & { successCount: number },
	) {
		report(
			{
				succeeded: response.succeededCount,
				total: response.results.length,
				failed: response.failedCount,
				successCount,
			},
			messages,
		)
	}

	return { runBulk, reportBatchOutcome }
}
