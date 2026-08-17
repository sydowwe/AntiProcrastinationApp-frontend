import { API } from '@/_common/axiosConfig.ts'
import { WeatherFit } from '@/core/leisure/dto/response/WeatherFit.ts'

/**
 * Today's weather condition, expressed the only way the picker's ranking and the backlog badge can
 * use it: which `activity-weather-dependency` lookup rows fit right now. Not implemented server-side
 * yet — see `prompts/leisure/backend/D2-backend.md` for the contract. Every call fails today, and
 * that failure must stay silent (`useWeatherFit` is the caller that enforces this): no location, no
 * provider, or a 404 all mean the same thing to the rest of the app — "no weather opinion".
 */
export function useLeisureWeatherApi() {
	async function fetchTodayFit(): Promise<WeatherFit | null> {
		try {
			const { data } = await API.get('/leisure-weather-fit', { _silent: true })
			return WeatherFit.fromJson(data)
		} catch {
			return null
		}
	}
	return { fetchTodayFit }
}
