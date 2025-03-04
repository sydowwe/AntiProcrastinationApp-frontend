import {ref} from 'vue';

export function useDialogComposition(){
    const dialog = ref(false);
    function open() {
        dialog.value = true;
    }
    function close() {
        dialog.value = false;
    }
    return {
        dialog,
        open,
        close
    }
}