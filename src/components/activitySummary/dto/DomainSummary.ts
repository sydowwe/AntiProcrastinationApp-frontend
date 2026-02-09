import type { ActivityStat } from './ActivityStat';

export class DomainSummary {
	constructor(
		public domain: string,
		public active: ActivityStat | null,
		public background: ActivityStat | null,
		public isNew: boolean
	) {}
}
