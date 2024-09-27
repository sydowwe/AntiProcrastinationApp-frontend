import { useI18n } from "vue-i18n";

function validateEmail(value: string) {
    const emailRegex = /[A-Z0-9a-z._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,64}/;
    return emailRegex.test(value);
}
function validateName(value: string) {
    const letterRegex = /^[a-zA-Z ]+$/;
    return letterRegex.test(value);
}
function validateSurname(value: string) {
    const letterRegex = /^[a-zA-Z ]+$/;
    return letterRegex.test(value);
}



export function useUserDetailsValidation(){
    const i18n  = useI18n();
    const emailRules = [(v: string) => !!v || i18n.t('authorization.emailRequired'), (v: string) => validateEmail(v) || i18n.t('authorization.invalidEmail')];
    const nameRules = [(v: string) => !!v || i18n.t('authorization.nameRequired'), (v: string) => validateName(v) || i18n.t('authorization.invalidName')];
    const surnameRules = [(v: string) => !!v || i18n.t('authorization.surnameRequired'), (v: string) => validateSurname(v) || i18n.t('authorization.invalidSurname')];

    return {
        emailRules,
        nameRules,
        surnameRules,
    }
}