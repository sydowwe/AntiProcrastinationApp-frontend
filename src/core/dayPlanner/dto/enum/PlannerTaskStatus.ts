import type { ValueTitleDto } from '@/_common/dto/dto/ValueTitleDto.ts'
import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'

export enum PlannerTaskStatus {
	NotStarted = 'notStarted',
	InProgress = 'inProgress',
	OnHold = 'onHold',
	Completed = 'completed',
	Cancelled = 'cancelled',
}

export function getPlannerTaskStatusColor(status: PlannerTaskStatus): string {
	switch (status) {
		case PlannerTaskStatus.NotStarted:
			return 'grey'
		case PlannerTaskStatus.InProgress:
			return 'blue'
		case PlannerTaskStatus.OnHold:
			return 'orange'
		case PlannerTaskStatus.Completed:
			return 'green'
		case PlannerTaskStatus.Cancelled:
			return 'red'
	}
}

export function getPlannerTaskStatusIcon(status: PlannerTaskStatus): string {
	switch (status) {
		case PlannerTaskStatus.NotStarted:
			return 'fa-hourglass-start'
		case PlannerTaskStatus.InProgress:
			return 'fa-spinner'
		case PlannerTaskStatus.OnHold:
			return 'fa-pause-circle'
		case PlannerTaskStatus.Completed:
			return 'fa-circle-check'
		case PlannerTaskStatus.Cancelled:
			return 'fa-circle-xmark'
	}
}

/**
 * The localized status list, with `value` typed as the enum rather than a bare `string`.
 *
 * The one cast is safe because `getEnumSelectOptions` builds every option straight from
 * `Object.values(PlannerTaskStatus)` — it only loses the type because its own generic is
 * `Record<string, string>`. Keeping the cast here means the three call sites can pass `option.value`
 * to `getPlannerTaskStatusIcon` / `changeStatus` without casting individually, which is how one of
 * them ended up passing the whole option object instead. The framework signature should return
 * `ValueTitleDto<T[keyof T]>`; see `migration-revision.md`.
 *
 * Must be called from a setup context — `getEnumSelectOptions` resolves the labels through `useI18n`.
 */
export function usePlannerTaskStatusOptions(): ValueTitleDto<PlannerTaskStatus>[] {
	return getEnumSelectOptions(PlannerTaskStatus, 'planner.status') as ValueTitleDto<PlannerTaskStatus>[]
}
