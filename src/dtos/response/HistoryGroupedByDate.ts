import {ActivityHistory} from './ActivityHistory';

export class HistoryGroupedByDate {
	constructor(
		public date: Date,
		public historyList: ActivityHistory[],
	) {
	}

	static fromJson(object: any) {
		const {} = object;
		const startTimestamp = new Date(object.date);
		const historyList = ActivityHistory.listFromObjects(object.historyResponseList);
		return new HistoryGroupedByDate(startTimestamp, historyList);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}
