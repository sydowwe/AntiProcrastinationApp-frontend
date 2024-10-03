import { useI18n } from "vue-i18n";

function validateEmail(value: string) {
    const emailRegex = /[A-Z0-9a-z._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,64}/;
    return emailRegex.test(value);
}

export function useUserDetailsValidation(){
    const i18n  = useI18n();
    const emailRules = [(v: string) => !!v || i18n.t('authorization.emailRequired'), (v: string) => validateEmail(v) || i18n.t('authorization.invalidEmail')];

    return {
        emailRules,
    }
}