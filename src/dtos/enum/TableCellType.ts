export enum TableCellType {
	TEXT = 'Text',
	NUMBER = 'Number',
	DECIMAL = 'Decimal',
	BOOLEAN = 'Boolean',
	SELECT = 'Select',
	DATE = 'Date',
	DATETIME = 'Datetime',
	IMAGE = 'Image',
	TEXTAREA = 'Textarea',
}

export function isNumericCell(cellType: TableCellType) {
	return cellType === TableCellType.NUMBER || cellType === TableCellType.DECIMAL;
}
