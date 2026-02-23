import {SelectOption} from '@/dtos/response/general/SelectOption.ts';
import {uncapitalizeString} from '@/scripts/helperMethods.ts';
import {TableCellType} from '@/dtos/enum/TableCellType.ts';

export class EditableColumnMetadata {
	constructor(
		public key: string,
		public type: TableCellType,
		public isReadOnly: boolean,
		public options: SelectOption[] | null = null,
	) {
	}

	static fromJson(json: any) {
		const {
			key = null,
			type = TableCellType.TEXT,
			isReadOnly = false,
			options = null,
		} = json;

		return new EditableColumnMetadata(uncapitalizeString(key), type, isReadOnly, options);
	}

	static listFromJsonList(jsonList: any[]): EditableColumnMetadata[] {
		return jsonList.map((item: object) => EditableColumnMetadata.fromJson(item));
	}
}

