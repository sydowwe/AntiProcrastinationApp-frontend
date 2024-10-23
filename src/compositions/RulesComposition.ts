import {useI18n} from 'vue-i18n';

export function isOnlyLettersWithDiacritics(value: string) {
	const letterRegex = /^(?!.*(\p{L})\1\1)(\p{L}+( \p{L}+){0,4}) *$/u;
	return letterRegex.test(value);
}


export function useRules(){
	const i18n  = useI18n();
	const requiredRule = (v: string) => !!v || i18n.t('rules.fieldIsRequired');

	const onlyLettersWithDiacriticsRule = (v: string) => isOnlyLettersWithDiacritics(v) || i18n.t('rules.onlyLettersWithDiacritics');
	return {requiredRule, onlyLettersWithDiacriticsRule};
}