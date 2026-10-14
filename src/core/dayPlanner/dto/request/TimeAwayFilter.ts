import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

/** `POST /time-away/filter`. Both bounds optional; with neither, the server returns every stretch, oldest first. */
export class TimeAwayFilter {
	constructor(
		public from: Date | null = null,
		public until: Date | null = null,
	) {}

	toJSON() {
		return {
			from: this.from ? formatDateForApi(this.from) : null,
			until: this.until ? formatDateForApi(this.until) : null,
		}
	}
}
