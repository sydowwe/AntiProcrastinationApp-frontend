import { DayType } from '@/_common/dto/enum/DayType.ts'

/**
 * Listed explicitly rather than derived from `Object.values(DayType)`: the framework enum also carries
 * `Holiday`, which this app's backend does not accept.
 */
export const dayTypeOptions = [DayType.Workday, DayType.Weekend, DayType.Vacation, DayType.SickDay, DayType.Special]
