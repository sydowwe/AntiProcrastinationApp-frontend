export function useContinuousQuickChangeComposition(quickChangeFunction: (value: number) => void) {
	let mouseDownTimeout = 0;

	function endContinuousQuickChange() {
		clearTimeout(mouseDownTimeout);
		window.removeEventListener('mouseup', endContinuousQuickChange);
	}

	function continuousQuickChangeValue(value: number) {
		mouseDownTimeout = setTimeout(() => {
			quickChangeFunction(value);
			continuousQuickChangeValue(value);
		}, 150);
		window.addEventListener('mouseup', endContinuousQuickChange);
	}

	return continuousQuickChangeValue;
}
export function preventE(event: KeyboardEvent) {
	if (event.key === 'e' || event.key === 'E') {
		event.preventDefault();
	}
}