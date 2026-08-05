import { ValueTitleDto } from '@/_common/dto/dto/ValueTitleDto.ts'

export enum TrackerDesktopMappingTypeEnum {
	Ignored = 'Ignored',
	Activity = 'Activity',
	// Category= 'Category',
	// Role= 'Role',
	// CategoryAndRole= 'CategoryAndRole'
}

export const TrackerDesktopMappingTypeOptions = [
	new ValueTitleDto(TrackerDesktopMappingTypeEnum.Ignored, TrackerDesktopMappingTypeEnum.Ignored),
	new ValueTitleDto(TrackerDesktopMappingTypeEnum.Activity, TrackerDesktopMappingTypeEnum.Activity),
]
