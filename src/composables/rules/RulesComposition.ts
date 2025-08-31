export function isOnlyLettersWithDiacritics(value: string) {
	const letterRegex = /^(?!.*(\p{L})\1\1)(\p{L}+( \p{L}+){0,4}) *$/u;
	return letterRegex.test(value);
}

export function isLettersWithDiacriticsAndSpecialChars(value: string) {
	const letterAndSpecialRegex = /^(?!.*(\p{L})\1\1)([\p{L}\p{P}\p{S}]+( [\p{L}\p{P}\p{S}]+){0,4}) *$/u;
	return letterAndSpecialRegex.test(value);
}

export function isOnlyNumbers(value: string) {
	const numberRegex = /^\d+$/;
	return numberRegex.test(value);
}

export function isLettersWithDiacriticsAndNumbersAndSpecialChars(value: string) {
	const letterSpecialAndNumberRegex = /^(?!.*(\p{L})\1\1)([\p{L}\p{P}\p{S}\p{N}]+( [\p{L}\p{P}\p{S}\p{N}]+){0,4}) *$/u;
	return letterSpecialAndNumberRegex.test(value);
}

export function isLettersAndNumbers(value: string) {
	const letterAndNumberRegex = /^[a-zA-Z0-9]+$/;
	return letterAndNumberRegex.test(value);
}

export function useGeneralRules() {
	const requiredRule = (v: any) => {
		// Handle different types of "empty" values
		if (v === null || v === undefined) return 'Toto pole je povinné';
		if (typeof v === 'string' && v.trim() === '') return 'Toto pole je povinné';
		if (Array.isArray(v) && v.length === 0) return 'Toto pole je povinné';

		// For numbers (including 0) and other truthy values
		return true;
	};

	const onlyLettersWithDiacriticsRule = (v: string) => isOnlyLettersWithDiacritics(v) || `Pole môže obsahovať len písmená`;

	const lettersWithDiacriticsAndSpecialCharsRule = (v: string) => isLettersWithDiacriticsAndSpecialChars(v) || `Pole môže obsahovať len písmená a špeciálne znaky`;

	const onlyNumbersRule = (v: string) => (!v || isOnlyNumbers(v)) || `Pole môže obsahovať len čísla`;

	const phoneNumberRule = (v: string) => {
		const regex = /^09\d{8}$/;
		return regex.test(v) || 'Telefónne číslo musí mať 10 čísel a začínať 09';
	};

	const lettersAndNumbersRule = (v: string) => isLettersAndNumbers(v) || `Pole môže obsahovať len písmená a čísla`;

	return {requiredRule, onlyLettersWithDiacriticsRule, lettersWithDiacriticsAndSpecialCharsRule, onlyNumbersRule, phoneNumberRule, lettersAndNumbersRule};
}