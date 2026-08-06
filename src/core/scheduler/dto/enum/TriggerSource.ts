export enum TriggerSource {
	Scheduled = 'Scheduled',
	Manual = 'Manual',
	Replay = 'Replay',
}

export const AllTriggerSourceList = [TriggerSource.Scheduled, TriggerSource.Manual, TriggerSource.Replay]
