import { DayOfWeek, DAY_OF_WEEK_SHORT_LABELS } from '@/_common/dto/enum/DayOfWeek.ts'
import { DayType } from '@/_common/dto/enum/DayType.ts'

export const dayOfWeekOptions = Object.values(DayOfWeek).map(d => ({ value: d, label: DAY_OF_WEEK_SHORT_LABELS[d] }))

/**
 * Listed explicitly rather than derived from `Object.values(DayType)`: the framework enum also carries
 * `Holiday`, which this app's backend does not accept.
 */
export const dayTypeOptions = [DayType.Workday, DayType.Weekend, DayType.Vacation, DayType.SickDay, DayType.Special]
