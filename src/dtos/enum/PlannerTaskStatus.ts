export enum PlannerTaskStatus {
	NotStarted = 'notStarted',
	InProgress = 'inProgress',
	OnHold = 'onHold',
	Completed = 'completed',
	Cancelled = 'cancelled'
}

export function getPlannerTaskStatusColor(status: PlannerTaskStatus): string {
	switch (status) {
		case PlannerTaskStatus.NotStarted:
			return 'grey';
		case PlannerTaskStatus.InProgress:
			return 'blue';
		case PlannerTaskStatus.OnHold:
			return 'orange';
		case PlannerTaskStatus.Completed:
			return 'green';
		case PlannerTaskStatus.Cancelled:
			return 'red';
	}
}

export function getPlannerTaskStatusIcon(status: PlannerTaskStatus): string {
	switch (status) {
		case PlannerTaskStatus.NotStarted:
			return 'fa-circle';
		case PlannerTaskStatus.InProgress:
			return 'fa-spinner';
		case PlannerTaskStatus.OnHold:
			return 'fa-pause-circle';
		case PlannerTaskStatus.Completed:
			return 'fa-circle-check';
		case PlannerTaskStatus.Cancelled:
			return 'fa-circle-xmark';
	}
}