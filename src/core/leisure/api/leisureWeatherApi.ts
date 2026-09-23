import { API } from '@/_common/axiosConfig.ts'
import { WeatherFit } from '@/core/leisure/dto/response/WeatherFit.ts'

/**
 * Today's weather condition, expressed the only way the picker's ranking and the backlog badge can
 * use it: which `activity-weather-dependency` lookup rows fit right now (`GET /leisure-weather-fit`).
 *
 * The server answers every failure — no location set, a place that does not geocode, a provider
 * outage — with `200` and an **empty** set, and its contract is that the client reads that exactly
 * like a failed call: "no weather opinion". So both collapse to `null` here, once, at the boundary.
 * An empty list must never reach a consumer: `isEligible` would read it as "nothing fits today" and
 * exclude every backlog entry that states a dependency. The call stays silent (`_silent`) for the
 * same reason — `useWeatherFit` is the caller, and a suggestion must never wait on or error over it.
 */
export function useLeisureWeatherApi() {
	async function fetchTodayFit(): Promise<WeatherFit | null> {
		try {
			const { data } = await API.get('/leisure-weather-fit', { _silent: true })
			const fit = WeatherFit.fromJson(data)
			return fit.matchingWeatherDependencyIds.length === 0 ? null : fit
		} catch {
			return null
		}
	}
	return { fetchTodayFit }
}
