<template>
	<div class="d-flex align-center justify-space-between ga-2 w-100">
		<div
			v-auto-animate
			class="d-flex flex-wrap ga-2 align-center flex-grow-1"
		>
			<ChipWithIcon
				v-for="chip in activeChips"
				:key="String(chip.key)"
				:icon="chip.info.icon"
				:color="chip.info.color"
				:vColor="chip.info.vColor"
				closable
				@click:close="onChipClose(chip)"
			>
				{{ chip.info.label }}
			</ChipWithIcon>
		</div>
		<VBtn
			class="mb-4"
			color="primary"
			prependIcon="filter"
			@click="open = !open"
		>
			{{ $t('general.filter') }}
		</VBtn>
	</div>

	<Teleport to="body">
		<Transition name="filter-panel-slide">
			<div
				v-if="open"
				class="filter-panel-overlay"
				:style="{ top: navbarHeight + 'px' }"
				@click.self="open = false"
			>
				<VCard
					class="filter-panel-card pa-4 d-flex flex-column ga-2"
					:style="{ width: width + 'px' }"
					rounded="0"
				>
					<div class="d-flex justify-space-between align-center">
						<h2>{{ title ?? i18n.t('general.filter') }}</h2>
						<VIconBtn
							size="x-small"
							icon="close"
							variant="tonal"
							color="secondaryOutline"
							@click="open = false"
						/>
					</div>
					<div class="filter-panel-fields my-2 d-flex flex-column ga-7 flex-grow-1 overflow-y-auto">
						<slot
							name="fields"
							:draft="draft"
						/>
					</div>
					<div class="mt-4 d-flex justify-center ga-6">
						<VBtn
							color="error"
							variant="outlined"
							@click="onReset"
						>
							{{ $t('general.clear') }}
						</VBtn>
						<VBtn
							color="primary"
							@click="onApply"
						>
							{{ $t('general.confirm') }}
						</VBtn>
					</div>
				</VCard>
			</div>
		</Transition>
	</Teleport>
</template>

<script lang="ts">
	export interface ChipInfo<TKey = string> {
		label: string
		icon?: string
		color?: string
		vColor?: string
		resetKeys?: TKey[]
	}

	export type ChipFormatter<T, K extends keyof T> = (value: T[K], filter: T) => ChipInfo<keyof T> | null
	export type ChipFormatters<T> = { [K in keyof T]?: ChipFormatter<T, K> }
</script>

<script setup lang="ts" generic="T extends object">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import ChipWithIcon from '@/components/general/ChipWithIcon.vue'

	const {
		defaultFactory,
		chipFormatters,
		width = 400,
		title,
		navbarHeight = 64,
	} = defineProps<{
		defaultFactory: () => T
		chipFormatters: ChipFormatters<T>
		width?: number
		title?: string
		navbarHeight?: number
	}>()

	const emit = defineEmits<{
		apply: []
		reset: []
	}>()

	const filter = defineModel<T>({ required: true })

	const i18n = useI18n()

	const open = ref(false)
	const draft = ref<T>(cloneFilter(filter.value)) as { value: T }

	watch(open, isOpen => {
		if (isOpen) {
			draft.value = cloneFilter(filter.value)
		}
	})

	function cloneFilter(src: T): T {
		return Object.assign(defaultFactory(), src)
	}

	interface ActiveChip {
		key: keyof T
		info: ChipInfo<keyof T>
	}

	const activeChips = computed<ActiveChip[]>(() => {
		const result: ActiveChip[] = []
		for (const key of Object.keys(chipFormatters) as (keyof T)[]) {
			const formatter = chipFormatters[key]
			if (!formatter) continue
			const info = formatter(filter.value[key], filter.value)
			if (info !== null) result.push({ key, info })
		}
		return result
	})

	function onApply() {
		filter.value = draft.value
		emit('apply')
		open.value = false
	}

	function onReset() {
		const fresh = defaultFactory()
		draft.value = cloneFilter(fresh)
		filter.value = fresh
		emit('reset')
		emit('apply')
		open.value = false
	}

	function onChipClose(chip: ActiveChip) {
		const keysToReset = chip.info.resetKeys ?? [chip.key]
		const defaults = defaultFactory()
		const next = cloneFilter(filter.value)
		for (const k of keysToReset) {
			next[k] = defaults[k]
		}
		filter.value = next
		emit('apply')
	}
</script>

<style scoped>
	.filter-panel-overlay {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		background: rgba(0, 0, 0, 0.32);
		display: flex;
		justify-content: flex-end;
		z-index: 1002;
	}

	.filter-panel-card {
		height: 100%;
		overflow: hidden;
	}

	.filter-panel-fields > * {
		flex: 0 0 auto !important;
	}

	.filter-panel-slide-enter-active,
	.filter-panel-slide-leave-active {
		transition: opacity 0.2s ease;
	}

	.filter-panel-slide-enter-active .filter-panel-card,
	.filter-panel-slide-leave-active .filter-panel-card {
		transition: transform 0.25s ease;
	}

	.filter-panel-slide-enter-from,
	.filter-panel-slide-leave-to {
		opacity: 0;
	}

	.filter-panel-slide-enter-from .filter-panel-card,
	.filter-panel-slide-leave-to .filter-panel-card {
		transform: translateX(100%);
	}
</style>
