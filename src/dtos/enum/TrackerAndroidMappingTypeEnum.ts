import { TitleValueObject } from '@/dtos/dto/TitleValueObject.ts'

export enum TrackerAndroidMappingTypeEnum {
	Ignored = 'Ignored',
	Activity = 'Activity',
}

export const TrackerAndroidMappingTypeOptions = [
	new TitleValueObject(TrackerAndroidMappingTypeEnum.Ignored, TrackerAndroidMappingTypeEnum.Ignored),
	new TitleValueObject(TrackerAndroidMappingTypeEnum.Activity, TrackerAndroidMappingTypeEnum.Activity),
]
