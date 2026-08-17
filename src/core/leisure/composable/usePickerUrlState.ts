import { onMounted, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import type { PickerConstraints } from '@/core/leisure/composable/leisureScoring.ts'

/**
 * `/leisure/pick?minutes=45&energy=low` has to be a bookmark — "I'm bored, and this is usually the
 * shape of my evening" — so every constraint lives in the query, not in component state.
 *
 * `seed` is in there too, and that is not decoration. The draw is deliberately random (see
 * `leisureScoring.ts`), and a random draw that is not addressable means a page reload silently
 * replaces the three options the user was still deciding between. With the seed in the URL, reload
 * and back both reproduce the same three cards, and "something else" is a real navigation to a new
 * draw rather than a re-render.
 */

/** Offered as one-tap chips rather than a number field: the point is to land and get an answer. */
export const TIME_OPTIONS = [15, 30, 60, 120, 240] as const
/** People available including the user. 4 stands for "a group" — it clears any sane minParticipants. */
export const PEOPLE_OPTIONS = [1, 2, 4] as const

const MINUTES_PARAM = 'minutes'
const ENERGY_PARAM = 'energy'
const PEOPLE_PARAM = 'people'
const COST_PARAM = 'cost'
const LOCATION_PARAM = 'location'
const SEED_PARAM = 'seed'

export const DEFAULT_CONSTRAINTS: PickerConstraints = {
	minutes: 60,
	energy: EnergyLevel.Medium,
	people: 1,
	maxCostTierId: null,
	locationTypeId: null,
}

function firstQueryValue(value: unknown): string | undefined {
	if (Array.isArray(value)) {
		return typeof value[0] === 'string' ? value[0] : undefined
	}
	return typeof value === 'string' ? value : undefined
}

/** Total by construction: the query string is user-editable, so garbage falls back to the default. */
function parsePositiveInt(raw: string | undefined, fallback: number): number {
	const parsed = Number(raw)
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseOptionalId(raw: string | undefined): number | null {
	const parsed = Number(raw)
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function parseEnergy(raw: string | undefined): EnergyLevel {
	const allowed = Object.values(EnergyLevel) as string[]
	return raw !== undefined && allowed.includes(raw) ? (raw as EnergyLevel) : DEFAULT_CONSTRAINTS.energy
}

export function paramsToConstraints(query: LocationQuery): PickerConstraints {
	return {
		minutes: parsePositiveInt(firstQueryValue(query[MINUTES_PARAM]), DEFAULT_CONSTRAINTS.minutes),
		energy: parseEnergy(firstQueryValue(query[ENERGY_PARAM])),
		people: parsePositiveInt(firstQueryValue(query[PEOPLE_PARAM]), DEFAULT_CONSTRAINTS.people),
		maxCostTierId: parseOptionalId(firstQueryValue(query[COST_PARAM])),
		locationTypeId: parseOptionalId(firstQueryValue(query[LOCATION_PARAM])),
	}
}

// 1-based: a seed of 0 would be rejected by `parsePositiveInt` on the way back in, so the one draw
// in four billion that produced it would refuse to reproduce itself.
function newSeed(): number {
	return (Math.floor(Math.random() * 0xffffffff) + 1) >>> 0
}

export interface PickerUrlState {
	constraints: Ref<PickerConstraints>
	seed: Ref<number>
	/** Draw again. The caller is responsible for recording the outgoing set as "seen" first. */
	reroll: () => void
}

export function usePickerUrlState(): PickerUrlState {
	const route = useRoute()
	const router = useRouter()

	const constraints = ref<PickerConstraints>(paramsToConstraints(route.query))
	const seed = ref(parsePositiveInt(firstQueryValue(route.query[SEED_PARAM]), newSeed()))

	async function syncToUrl() {
		const query: LocationQueryRaw = { ...route.query }
		// The three primary constraints are written even at their defaults: a shared link should say
		// what it means rather than depend on the reader's defaults matching the sender's.
		query[MINUTES_PARAM] = String(constraints.value.minutes)
		query[ENERGY_PARAM] = constraints.value.energy
		query[PEOPLE_PARAM] = String(constraints.value.people)
		query[SEED_PARAM] = String(seed.value)

		for (const [key, value] of [
			[COST_PARAM, constraints.value.maxCostTierId],
			[LOCATION_PARAM, constraints.value.locationTypeId],
		] as const) {
			if (value === null) {
				delete query[key]
			} else {
				query[key] = String(value)
			}
		}

		try {
			await router.replace({ query })
		} catch {
			// navigation duplication / redirection errors are non-fatal for state sync
		}
	}

	watch([constraints, seed], syncToUrl, { deep: true })
	// Once on arrival, so a bare `/leisure/pick` becomes a shareable URL with the seed it actually
	// drew — done after mount rather than during setup so it cannot race the entering navigation.
	onMounted(() => void syncToUrl())

	function reroll() {
		seed.value = newSeed()
	}

	return { constraints, seed, reroll }
}
