import { PageVisit } from './PageVisit'

export class DomainDetails {
	constructor(
		public domain: string,
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public entries: number,
		public pages: PageVisit[]
	) {}
}
