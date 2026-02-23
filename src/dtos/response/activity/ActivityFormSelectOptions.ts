import {SelectOption} from '@/dtos/response/general/SelectOption.ts';

export class ActivityFormSelectOptions {
	constructor(
		public activityOptions: SelectOption[] = [],
		public roleOptions: SelectOption[] = [],
		public categoryOptions: SelectOption[] = [],
		public taskPriorityOptions: SelectOption[] = [],
		public routineTimePeriodOptions: SelectOption[] = [],
	) {
	}
}
