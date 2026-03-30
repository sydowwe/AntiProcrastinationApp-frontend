<template>
	<div>
		<p
			v-if="label"
			class="text-caption text-medium-emphasis mb-2"
		>
			{{ label }}
		</p>
		<div class="d-flex flex-wrap ga-2 align-center">
			<VTooltip
				v-for="color in COLOR_PALETTE"
				:key="color.name"
				:text="color.label"
				location="top"
				openDelay="300"
			>
				<template #activator="{ props }">
					<button
						v-bind="props"
						type="button"
						class="color-swatch"
						:style="{ backgroundColor: color[currentTheme].bg }"
						:class="{ 'color-swatch--selected': model === color.name }"
						@click="model = color.name"
					>
						<VIcon
							v-if="model === color.name"
							icon="check"
							size="10"
							:style="{ color: onSwatchColor(color[currentTheme].bg) }"
						/>
					</button>
				</template>
			</VTooltip>
			<VTooltip
				text="None"
				location="top"
				openDelay="300"
			>
				<template #activator="{ props }">
					<button
						v-bind="props"
						type="button"
						class="color-swatch color-swatch--none"
						:class="{ 'color-swatch--selected': !model }"
						@click="model = undefined"
					>
						<VIcon
							v-if="!model"
							icon="check"
							size="10"
						/>
					</button>
				</template>
			</VTooltip>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useTheme } from 'vuetify'
	import { computed } from 'vue'
	import { COLOR_PALETTE } from '@/utils/colorPalette.ts'

	defineProps<{ label?: string }>()
	const model = defineModel<string | undefined>()
	const theme = useTheme()
	const currentTheme = computed(() => (theme.global.current.value.dark ? 'dark' : ('light' as const)))

	function onSwatchColor(bgHex: string): string {
		const r = parseInt(bgHex.slice(1, 3), 16)
		const g = parseInt(bgHex.slice(3, 5), 16)
		const b = parseInt(bgHex.slice(5, 7), 16)
		const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
		return luminance > 0.4 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)'
	}
</script>

<style scoped>
	.color-swatch {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 2px solid transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.1s,
			border-color 0.1s;
		flex-shrink: 0;
	}

	.color-swatch:hover {
		transform: scale(1.15);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.color-swatch--selected {
		border-color: rgba(255, 255, 255, 0.9);
		transform: scale(1.1);
	}

	.color-swatch--none {
		background-color: rgba(255, 255, 255, 0.08);
		border: 2px dashed rgba(255, 255, 255, 0.3);
	}

	.color-swatch--none.color-swatch--selected {
		border-color: rgba(255, 255, 255, 0.9);
	}
</style>
