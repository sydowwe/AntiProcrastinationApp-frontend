import { TimeObject } from '../TimeUtils';
import { ToDoListItemRequest, ToDoListItemEntity } from '../ToDoListItem';
export interface VuetifyFormType {
    validate(): Promise<{ valid: boolean }>;
}
export interface SubmittableType{
    submit(): void; 
}
export interface DialogType{
    open(): void; 
    close(): void;
}
export interface FeedBackType{
    show(): void;
    show(message:string): void;
    hide(): void;
}
export interface ActivityDialogType{
    open(activityName:string, timeSpentNice:string): void; 
}
export interface ToDoListItemDialogType{
    openCreate(): void; 
    openEdit(toDoListItemEntity: ToDoListItemEntity): void; 
}
export interface DialogFormType extends DialogType, FormType{

}
export interface FormType {
    validate(): boolean;
    submit(): void;
}
export interface ActivitySelectionFormType extends FormType {
    addActivityToHistory(timeObject :TimeObject,startTimestamp:number): void;
    selectedActivityName: string;
}

export interface HistoryRecordItemType{
    getEndOfActivityTime(startTimestamp: Date, length: number): Date;
    getNiceTimestamp(timestamp: Date): string;
}