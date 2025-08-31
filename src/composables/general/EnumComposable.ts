export function convertToEnum<TEnum extends Record<string, string>>(
	enumObject: TEnum,
	key: string
) {
	return enumObject[key as keyof TEnum];
}


export function getEnumKeyByValue<T extends Record<string, string>>(
	enumObject: T,
	value: string
): keyof T | undefined {
	const entry = Object.entries(enumObject).find(([key, val]) => val === value);
	return entry ? entry[0] as keyof T : undefined;
}


export function getEnumSelectOptions<T extends Record<string, string>>(enumObject: T) {
	return Object.values(enumObject)
}