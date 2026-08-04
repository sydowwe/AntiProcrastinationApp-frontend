/** Why a dispatch was skipped rather than sent. Only meaningful when the outcome is Skipped. */
export enum SkipReason {
	NoRecipients = 'NoRecipients',
	OptedOut = 'OptedOut',
	Dismissed = 'Dismissed',
	Snoozed = 'Snoozed',
}

export const AllSkipReasonList = [
	SkipReason.NoRecipients,
	SkipReason.OptedOut,
	SkipReason.Dismissed,
	SkipReason.Snoozed,
]
