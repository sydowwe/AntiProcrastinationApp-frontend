import { TimeObject } from './TimeUtils';
import { ToDoListItemRequest } from './ToDoListItemEntity';
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
export interface ActivityDialogType{
    open(activityName:string, timeSpentNice:string): void; 
}
export interface ToDoListItemDialog {
    open(oldToDoListItem: ToDoListItemRequest, id: number): void; 
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