import {Category} from './Category';
import {Role} from "./Role";

export class Activity {
	constructor(
		public id: number = 0,
		public name: string,
		public text: string | null,
		public isUnavoidable: boolean,
		public role: Role,
		public category: Category | null,
	) {
	}

	static fromJson(object: any) {
		const {
			id = 0,
			name = '',
			text = '',
			isUnavoidable = false,
			role = new Role(),
			category = new Category()
		} = object;
		return new Activity(id, name, text, isUnavoidable, role, category);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export class ActivityRequest {

	constructor(public name: string = '',
	            public text: string | null = null,
	            public roleId: number | null = null,
	            public categoryId: number | null = null,
	            public isUnavoidable: boolean = false,
	            public isOnToDoList: boolean = false,
	            public toDoListUrgencyId: number | null = null
	) {

	}

	static fromJson(object: any) {
		const {
			name = '',
			text = '',
			isOnToDoList = false,
			isUnavoidable = false,
			roleId = 0,
			categoryId = 0
		} = object;
		return new ActivityRequest(name, text, isOnToDoList, isUnavoidable, roleId, categoryId);
	}
}

export class QuickEditActivityRequest {
	constructor(public name: string = '',
	            public text: string | null = null,
	            public categoryId: number | null = null,
	) {
	}

	static fromJson(object: any) {
		const {
			name = '',
			text = '',
		} = object;
		return new QuickEditActivityRequest(name, text);
	}
}

export class QuickActivityToolsDto {
	constructor(
		public id: number,
		public name: string,
		public text: string | null,
		public categoryId: number | null
	) {
	}
	static get createEmpty() {
		return new QuickActivityToolsDto(0, '', null, null);
	}
}
