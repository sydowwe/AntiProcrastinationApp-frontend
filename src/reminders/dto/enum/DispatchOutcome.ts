/** Outcome of a single dispatch (send) record. The log is append-only — a Reversal is a correction record. */
export enum DispatchOutcome {
	Sent = 'Sent',
	Skipped = 'Skipped',
	Failed = 'Failed',
	// A correction that supersedes an earlier record (never an edit of it).
	Reversal = 'Reversal',
}

export const AllDispatchOutcomeList = [
	DispatchOutcome.Sent,
	DispatchOutcome.Skipped,
	DispatchOutcome.Failed,
	DispatchOutcome.Reversal,
]
