import {computed} from 'vue';

export const formatWorkHours = computed(() => (workHours: number) => {
	const hours = Math.floor(workHours);
	const minutes = Math.round((workHours - hours) * 60);
	switch (true) {
		case hours === 0 && minutes === 0:
			return '';
		case hours === 0:
			return minutes + 'm';
		case minutes === 0:
			return hours + 'h';
		default:
			return hours + 'h ' + minutes + 'm';
	}
})