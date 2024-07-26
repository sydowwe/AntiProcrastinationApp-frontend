import {useI18n} from 'vue-i18n';
import 'moment/dist/locale/sk';
import 'moment/dist/locale/cs';
import moment from 'moment';
import {LongDateFormatKey} from 'moment/moment';

export function useMoment(){
	const i18n = useI18n();
	function formatDateLocalized(date: Date) {
		return moment(date).locale(i18n.locale.value).format('L');
	}
	function formatToTime(date: Date) {
		return moment(date).locale(i18n.locale.value).format('LT');
	}
	function formatToTimeWithSec(date: Date) {
		return moment(date).locale(i18n.locale.value).format('LT');
	}
	function formatLocalized(date: Date, format: moment.LongDateFormatKey) {
		return moment(date).locale(i18n.locale.value).format(format);
	}
	return {formatDateLocalized,formatToTime,formatToTimeWithSec,formatLocalized};
}

