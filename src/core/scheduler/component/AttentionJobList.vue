<template>
	<VCard
		class="d-flex flex-column pa-4 flex-grow-1"
		:class="{ 'opacity-60': isEmpty }"
		style="min-width: 320px; flex-basis: 31%"
	>
		<div class="d-flex align-center ga-3 mb-3">
			<VIcon
				:icon
				:color="isEmpty ? 'textMuted' : color"
				size="26"
			/>
			<div class="flex-grow-1">
				<div class="text-subtitle-1 font-weight-medium">{{ title }}</div>
				<div
					v-if="subtitle"
					class="text-caption text-medium-emphasis"
				>
					{{ subtitle }}
				</div>
			</div>
			<div
				class="text-h5 font-weight-bold"
				:class="isEmpty ? 'text-medium-emphasis' : `text-${color}`"
			>
				{{ items.length }}
			</div>
		</div>

		<div
			v-if="isEmpty"
			class="d-flex align-center ga-2 text-medium-emphasis py-3"
		>
			<VIcon
				icon="circle-check"
				size="18"
			/>
			<span class="text-body-2">{{ $t('scheduler.needsAttention.none') }}</span>
		</div>

		<div
			v-else
			v-auto-animate
		>
			<RouterLink
				v-for="item in items"
				:key="item.id"
				class="attention-row d-flex flex-column ga-1 py-2 px-2 rounded"
				:to="{ name: 'schedulerJobDetail', params: { id: item.id } }"
			>
				<div class="d-flex align-center justify-space-between ga-2">
					<span class="font-monospace text-body-2 font-weight-medium text-truncate">{{ item.jobKey }}</span>
					<span class="text-caption text-no-wrap text-medium-emphasis">{{ item.ownerModule }}</span>
				</div>
				<span
					v-if="item.detail"
					class="text-caption text-truncate"
					:class="`text-${color}`"
				>
					{{ item.detail }}
				</span>
			</RouterLink>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { AttentionJobItem } from '@/core/scheduler/dto/response/AttentionJobItem.ts'

	const { items, color = 'primary' } = defineProps<{
		title: string
		icon: string
		color?: string
		subtitle?: string
		items: AttentionJobItem[]
	}>()

	const isEmpty = computed(() => items.length === 0)
</script>

<style scoped>
	.attention-row {
		color: inherit;
		text-decoration: none;
		transition: background-color 0.15s ease;
	}

	.attention-row:hover {
		background-color: rgba(var(--v-theme-on-surface), 0.06);
	}
</style>
