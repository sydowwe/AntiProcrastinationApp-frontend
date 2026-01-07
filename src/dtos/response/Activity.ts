import {Category} from './Category';
import {Role} from "./Role";

export class Activity {
	constructor(
		public id: number,
		public name: string,
		public text: string | null = null,
		public isUnavoidable: boolean,
		public role: Role,
		public category: Category | null = null,
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