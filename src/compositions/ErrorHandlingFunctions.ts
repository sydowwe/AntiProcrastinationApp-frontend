import { importDefaults } from './general/Defaults';
const { showErrorSnackbar } = importDefaults();
export function handleHttpCodes(statusCode: number){
    switch (statusCode) {
        case 409:
            showErrorSnackbar('Conflict');
            break;
    
        default:
            break;
    }
}