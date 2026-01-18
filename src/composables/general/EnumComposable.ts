import {useI18n} from 'vue-i18n';
import {TitleValueObject} from '@/dtos/dto/TitleValueObject.ts';

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


export function getEnumSelectOptions<T extends Record<string, string>>(enumObject: T, prefix: string) {
	const i18 = useI18n();
	const values = Object.values(enumObject)

	return values.map(value => (new TitleValueObject(value, i18.t(`${prefix}.${value}`))))
}