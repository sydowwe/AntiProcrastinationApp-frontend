import 'moment/dist/locale/sk';
import 'moment/dist/locale/cs';
import moment from 'moment';
import {capitalizeString} from '@/scripts/helperMethods';

export function useMoment() {
	function toUTCDate(date: Date) {
		let d = new Date(date);
		d.setHours(0)
		d.setMinutes(0)
		return d;
	}

	function timeNiceFromMinutes(minutes: number) {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours > 0) {
			return `${hours}h ${remainingMinutes}m`;
		}
		return `${minutes}m`;
	}

	function stringToUTCDate(str: string) {
		return toUTCDate(moment(str, 'DD.MM.YYYY').toDate());
	}

	function formatToDateWithDay(date: Date | null) {
		return moment(date).locale('sk').format('dd DD.MM.');
	}

	function formatToDateWithDayAfter(date: Date | null) {
		return moment(date).locale('sk').format('DD.MM. dd');
	}

	function formatToDateWithoutYear(date: Date | null) {
		return moment(date).locale('sk').format('DD.MM.');
	}

	function formatToDate(date: Date | null) {
		return moment(date).locale('sk').format('L');
	}

	function formatToTime(date: Date) {
		return moment(date).locale('sk').format('LT');
	}

	function formatToTimeWithSec(date: Date) {
		return moment(date).locale('sk').format('LTS');
	}

	function formatLocalized(date: Date, format: string) {
		return moment(date).locale('sk').format(format);
	}

	function formatToTime24H(date: Date) {
		return moment(date).locale('sk').format('H:mm');
	}

	function equalsOnlyDate(date1: Date, date2: Date) {
		return moment(date1).isSame(date2, 'day');
	}

	return {
		timeNiceFromMinutes,
		toUTCDate,
		stringToUTCDate,
		formatToDateWithDay,
		formatToDateWithDayAfter,
		formatToDateWithoutYear,
		formatToDate,
		formatToTime,
		formatToTimeWithSec,
		formatToTime24H,
		formatLocalized,
		equalsOnlyDate
	};
}


export function getTranslatedMonths(locale = 'sk') {
	const months = moment.localeData(locale).months();
	return months.map((month, index) => ({
		value: index + 1,
		title: capitalizeString(month)
	}));
}