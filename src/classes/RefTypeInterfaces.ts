import { TimeObject } from './TimeUtils';
export interface VuetifyFormType {
    validate: () => Promise<{ valid: boolean }>;
}
export interface SubmittableType{
    submit: () => void; 
}
export interface DialogType{
    open(activityName:string, timeSpentNice:string): void; 
    open(): void; 
}
export interface FormType {
    validate: () => boolean;
}
export interface ActivitySelectionFormType extends FormType {
    addActivityToHistory: (timeObject :TimeObject,startTimestamp:number) => void;
    selectedActivityName: string;
}