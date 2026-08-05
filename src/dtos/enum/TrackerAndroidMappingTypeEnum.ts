import { ValueTitleDto } from '@/_common/dto/dto/ValueTitleDto.ts'

export enum TrackerAndroidMappingTypeEnum {
	Ignored = 'Ignored',
	Activity = 'Activity',
}

export const TrackerAndroidMappingTypeOptions = [
	new ValueTitleDto(TrackerAndroidMappingTypeEnum.Ignored, TrackerAndroidMappingTypeEnum.Ignored),
	new ValueTitleDto(TrackerAndroidMappingTypeEnum.Activity, TrackerAndroidMappingTypeEnum.Activity),
]
