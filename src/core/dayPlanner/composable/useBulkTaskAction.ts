import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { formatToDateWithDay } from '@/_common/utils/DateTimeHelper.ts'
import type { BatchOperationResponse } from '@/core/dayPlanner/dto/response/BatchOperationResult.ts'
import { CalendarBatchFailureReason } from '@/core/dayPlanner/dto/enum/CalendarBatchFailureReason.ts'

/** Dates named per reason before the rest collapse into "+N more" — a snackbar is not a list view. */
const MAX_NAMED_DAYS = 5
/** A partial message that names days needs reading time, unlike the 3 s a bare count gets. */
const NAMED_DAYS_TIMEOUT = 10000

export interface BatchOutcomeOptions extends BulkActionMessages {
	/** The days the batch was sent for — the snackbar names failed ones by their date. */
	days: { id: number; date: string }[]
	successCount: number
	/** Overrides the generic wording for a reason, when the call site knows more (e.g. which day type). */
	describeReason?: (reason: CalendarBatchFailureReason) => string | undefined
}

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
	 *
	 * A partial failure names the failed days, grouped by reason (OP9) — "5 of 7" alone left the user
	 * hunting a month for the two that did not take. Returns the ids worth re-selecting so the caller
	 * can highlight them: every failed day except a `NotFound` one, which no longer has a cell.
	 */
	function reportBatchOutcome(
		response: BatchOperationResponse,
		{ successCount, days, describeReason, ...messages }: BatchOutcomeOptions,
	): number[] {
		const failed = response.failedResults
		if (failed.length === 0) {
			report(
				{ succeeded: response.succeededCount, total: response.results.length, failed: 0, successCount },
				messages,
			)
			return []
		}

		const reselect = failed
			.filter(r => r.failureReason !== CalendarBatchFailureReason.NotFound)
			.map(r => r.calendarId)
		const dateById = new Map(days.map(d => [d.id, d.date]))
		// Map keeps first-seen order, and results arrive in request order, so groups read chronologically.
		const byReason = new Map<CalendarBatchFailureReason, string[]>()
		for (const result of failed) {
			const reason = result.failureReason ?? CalendarBatchFailureReason.Error
			const date = dateById.get(result.calendarId)
			const dates = byReason.get(reason) ?? []
			if (date) dates.push(formatToDateWithDay(date))
			byReason.set(reason, dates)
		}

		const groups = [...byReason].map(([reason, dates]) => {
			const reasonText = describeReason?.(reason) ?? t(`planner.feedback.batchFailure.reason.${reason}`)
			if (dates.length === 0) return reasonText
			const named = dates.slice(0, MAX_NAMED_DAYS)
			if (dates.length > MAX_NAMED_DAYS) {
				named.push(t('planner.feedback.batchFailure.moreDays', { count: dates.length - MAX_NAMED_DAYS }))
			}
			return t('planner.feedback.batchFailure.group', { days: named.join(', '), reason: reasonText })
		})

		const parts = [
			`${t(messages.partialKey, {
				succeeded: response.succeededCount,
				total: response.results.length,
				failed: failed.length,
			})}.`,
			`${groups.join('; ')}.`,
		]
		if (reselect.length > 0) {
			parts.push(t('planner.feedback.batchFailure.stillSelected', reselect.length))
		}
		showErrorSnackbar(parts.join(' '), { timeout: NAMED_DAYS_TIMEOUT, closable: true })
		return reselect
	}

	return { runBulk, reportBatchOutcome }
}
