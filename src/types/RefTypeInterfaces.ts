import {PlannerTask} from '@/dtos/response/PlannerTask';
import {Time} from '@/utils/Time.ts';
import {RoutineTodoListItemEntity, TodoListItemEntity} from '@/dtos/response/ToDoListItem';
import {Alarm} from '@/dtos/response/Alarm';
import {ActivityFormRequest} from '@/dtos/request/ActivityFormRequest';
import type {Ref, UnwrapRef} from 'vue';

export interface VuetifyFormType {
	validate(): Promise<{ valid: boolean }>;

	resetValidation(): void;

	reset(): void;
}

export interface SubmittableType {
	submit(): void;
}

export interface FeedBackType {
	show(): void;

	show(message: string): void;

	hide(): void;
}

export interface DialogType {
	open(): void;

	close(): void;
}

export interface FormDialogType extends DialogType {
	reset(): void;

	closeAndReset(): void;
}

export interface FormType {
	validate(): boolean;

	submit(): void;
}

export interface EntityDialogType {
	openCreate(): void;

	close(): void;

	closeAndReset(): void;
}

export interface ActivityDialogType {
	open(activityName: string, timeSpent: Time): void;
}

export interface ToDoListItemDialogType extends EntityDialogType {
	openEdit(toDoListItemEntity: TodoListItemEntity): void;
}

export interface RoutineToDoListItemDialogType extends EntityDialogType {
	openEdit(toDoListItemEntity: RoutineTodoListItemEntity): void;
}

export interface PlannerDialogType extends EntityDialogType {
	openEdit(plannerTask: PlannerTask): void;
}

export interface AlarmDialogType extends EntityDialogType {
	openEdit(alarm: Alarm): void;
}


export interface ActivitySelectionFormType extends FormType {
	saveActivityToHistory(startTimestamp: Date, activityLength: Time): void;

	getSelectedName(type: 'role' | 'category' | 'taskPriority' | 'routineTimePeriod'): string;

	getSelectedActivityName: string | null;
	getSelectedActivityId: number;

	setSelectedActivityId(activityId: number): void;

	formData: Ref<UnwrapRef<ActivityFormRequest>>;
}

export interface HistoryRecordItemType {
	getEndOfActivityTime(startTimestamp: Date, length: number): Date;

	getNiceTimestamp(timestamp: Date): string;
}

export interface TimeLengthPickerType {
	time: Time;
}

export interface MyTwoFactorAuthInputType {
	triggerVisibilityCheck(): Promise<boolean>;
}

export interface TimePickerType {
	set(hours: number, minutes: number): void;

	set(hours: number, minutes: number, seconds: number): void;

	reset(): void;
}

export interface DateTimePickerType {
	getDateISO: string | null;
	getDateTime: Date | null;
	getDate: Date | null;

	setDate(newDate: Date): void;

	setTime(hours: number, minutes: number): void;
}
