import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/sk'
import 'dayjs/locale/cs'
import { capitalizeString } from '@/utils/helperMethods.ts'
import { Time } from '@/dtos/dto/Time.ts'

dayjs.extend(customParseFormat)
dayjs.extend(localizedFormat)
dayjs.extend(utc)

export function useMoment() {
	function toUTCDate(date: Date) {
		const d = new Date(date)
		d.setHours(0)
		d.setMinutes(0)
		return d
	}

	function timeNiceFromMinutes(minutes: number) {
		const hours = Math.floor(minutes / 60)
		const remainingMinutes = minutes % 60

		if (hours > 0) {
			return `${hours}h ${remainingMinutes}m`
		}
		return `${minutes}m`
	}

	function stringToUTCDate(str: string) {
		return toUTCDate(dayjs(str, 'DD.MM.YYYY').toDate())
	}

	function urlStringToUTCDate(str: string) {
		return toUTCDate(dayjs(str, 'DD-MM-YYYY').toDate())
	}

	function usStringToUrlString(str: string) {
		const parts = str.split('-')
		return `${parts[2]}-${parts[1]}-${parts[0]}`
	}

	function formatToUsString(date: Date) {
		return dayjs(toUTCDate(date)).format('YYYY-MM-DD')
	}

	function formatToDateWithDay(date: Date | null) {
		return dayjs(date).locale('sk').format('dd DD.MM.')
	}

	function formatToDateWithDayAfter(date: Date | null) {
		return dayjs(date).locale('sk').format('DD.MM. dd')
	}

	function formatToDateWithoutYear(date: Date | null) {
		return dayjs(date).locale('sk').format('DD.MM.')
	}

	function formatToDate(date: Date | null) {
		return dayjs(date).locale('sk').format('L')
	}

	function formatToTime(date: Date) {
		return dayjs(date).locale('sk').format('LT')
	}

	function formatToTimeWithSec(date: Date) {
		return dayjs(date).locale('sk').format('LTS')
	}

	function formatLocalized(date: Date, format: string) {
		return dayjs(date).locale('sk').format(format)
	}

	function formatToTime24H(date: Date) {
		return dayjs(date).locale('sk').format('HH:mm')
	}

	function equalsOnlyDate(date1: Date, date2: Date) {
		return dayjs(date1).isSame(date2, 'day')
	}

	function formatTimeDtoToUtcTimeDto(time: Time) {
		const tmp = dayjs(time.getString(), 'HH:mm')
		const formatted = tmp.utc().format('HH:mm')
		return Time.fromString(formatted)
	}

	return {
		timeNiceFromMinutes,
		toUTCDate,
		stringToUTCDate,
		urlStringToUTCDate,
		usStringToUrlString,
		formatToUsString,
		formatToDateWithDay,
		formatToDateWithDayAfter,
		formatToDateWithoutYear,
		formatToDate,
		formatToTime,
		formatToTimeWithSec,
		formatToTime24H,
		formatLocalized,
		equalsOnlyDate,
		formatTimeDtoToUtcTimeDto,
	}
}

export function getTranslatedMonths(locale = 'sk') {
	const months = Array.from({ length: 12 }, (_, i) =>
		capitalizeString(dayjs().locale(locale).month(i).format('MMMM')),
	)
	return months.map((month, index) => ({
		value: index + 1,
		title: month,
	}))
}
