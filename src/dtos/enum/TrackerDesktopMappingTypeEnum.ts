import { TitleValueObject } from '@/dtos/dto/TitleValueObject.ts'

export enum TrackerDesktopMappingTypeEnum {
	Ignored = 'Ignored',
	Activity = 'Activity',
	// Category= 'Category',
	// Role= 'Role',
	// CategoryAndRole= 'CategoryAndRole'
}

export const TrackerDesktopMappingTypeOptions = [
	new TitleValueObject(TrackerDesktopMappingTypeEnum.Ignored, TrackerDesktopMappingTypeEnum.Ignored),
	new TitleValueObject(TrackerDesktopMappingTypeEnum.Activity, TrackerDesktopMappingTypeEnum.Activity),
]
