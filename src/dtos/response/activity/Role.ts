import type {INameTextColorIconResponse} from '@/dtos/response/interface/INameTextColorIconResponse.ts';

export class Role implements INameTextColorIconResponse {
	constructor(
		public id: number = 0,
		public name: string = '',
		public text: string | null = null,
		public color: string | null = null,
		public icon: string | null = null,
	) {
	}

	static fromJson(object: any) {
		const {
			id = 0,
			name = '',
			text = '',
			color = '',
			icon = '',
		} = object;
		return new Role(id, name, text, color,
			icon,
		);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => Role.fromJson(item));
	}
}