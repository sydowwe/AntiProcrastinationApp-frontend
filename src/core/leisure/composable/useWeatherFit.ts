import { onMounted, ref, type Ref } from 'vue'
import { useLeisureWeatherApi } from '@/core/leisure/api/leisureWeatherApi.ts'
import type { WeatherFit } from '@/core/leisure/dto/response/WeatherFit.ts'

/**
 * Fetches today's weather fit once per mounted view and shares the graceful-absence rule with every
 * caller: `null` means "no opinion" — no location preference, no provider, the endpoint not existing
 * yet, or the call failing — and every consumer (the picker's ranking, the backlog badge) must treat
 * that identically to there being no weather feature at all. Never blocks or retries; a suggestion or
 * a table row must never wait on this.
 */
export function useWeatherFit(): Ref<WeatherFit | null> {
	const { fetchTodayFit } = useLeisureWeatherApi()
	const fit = ref<WeatherFit | null>(null)
	onMounted(async () => {
		fit.value = await fetchTodayFit()
	})
	return fit
}

/** `false` whenever the signal is unavailable, so callers never need to null-check separately. */
export function fitsToday(weatherDependencyId: number | null | undefined, fit: WeatherFit | null): boolean {
	if (weatherDependencyId == null || fit === null) return false
	return fit.matchingWeatherDependencyIds.includes(weatherDependencyId)
}
