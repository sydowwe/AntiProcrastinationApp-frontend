import { PageVisit } from './PageVisit'

export class DomainPieData {
	constructor(
		public domain: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
		public pages: PageVisit[],
		public entries?: number
	) {}
}
