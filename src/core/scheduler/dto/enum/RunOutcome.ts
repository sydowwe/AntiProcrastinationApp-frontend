export enum RunOutcome {
	Succeeded = 'Succeeded',
	Failed = 'Failed',
	Skipped = 'Skipped',
	Vetoed = 'Vetoed',
}

export const AllRunOutcomeList = [RunOutcome.Succeeded, RunOutcome.Failed, RunOutcome.Skipped, RunOutcome.Vetoed]
