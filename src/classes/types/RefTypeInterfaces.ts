import {PlannerTask} from '../PlannerTask';
import {TimeLengthObject} from '../TimeUtils';
import {ToDoListItemEntity, RoutineToDoListItemEntity} from '../ToDoListItem';
import {Alarm} from '@/classes/Alarm';
import {ActivityFormRequest} from '@/classes/ActivityFormHelper';
import {Ref, UnwrapRef} from 'vue';

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

export interface EntityDialogType {
	openCreate(): void;

	close(): void;
	closeAndReset(): void;
}

export interface ActivityDialogType {
	open(activityName: string, timeSpentNice: string): void;
}

export interface ToDoListItemDialogType extends EntityDialogType {
	openEdit(toDoListItemEntity: ToDoListItemEntity): void;
}

export interface RoutineToDoListItemDialogType extends EntityDialogType {
	openEdit(toDoListItemEntity: RoutineToDoListItemEntity): void;
}

export interface PlannerDialogType extends EntityDialogType {
	openEdit(plannerTask: PlannerTask): void;
}
export interface AlarmDialogType extends EntityDialogType {
	openEdit(alarm: Alarm): void;
}

export interface DialogFormType extends DialogType, FormType {
}

export interface FormType {
	validate(): boolean;

	submit(): void;
}

export interface ActivitySelectionFormType extends FormType {
	saveActivityToHistory(startTimestamp: Date, activityLength: TimeLengthObject): void;
	getSelectedActivityName: string | null;
	getSelectedActivityId: number;
	setSelectedActivityId(activityId: number):void;
	formData: Ref<UnwrapRef<ActivityFormRequest>>;
}

export interface HistoryRecordItemType {
	getEndOfActivityTime(startTimestamp: Date, length: number): Date;

	getNiceTimestamp(timestamp: Date): string;
}

export interface TimeLengthPickerType {
	time: TimeLengthObject;
}

export interface MyTwoFactorAuthInputType {
	triggerVisibilityCheck(): Promise<boolean>;
}

export interface TimePickerType {
	set(hours: number, minutes: number): void;
	set(hours: number, minutes: number, seconds: number): void;
	reset(): void;
}

export interface MyDatePickerType {
	getDateISO: string | null;
	getDate: Date | null;

	setDate(newDate: Date): void;
}

export interface DateTimePickerType {
	getDateTimeISO: string | null;
	getDateISO: string | null;
	getDateTime: Date | null;
	getDate: Date | null;

	setDate(newDate: Date): void;

	setTime(hours: number, minutes: number): void;
}