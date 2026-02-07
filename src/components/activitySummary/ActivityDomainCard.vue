<template>
	<VCard
		class="domain-card"
		:class="{ 'domain-card--clickable': true }"
		elevation="2"
		@click="handleClick"
		@keydown.enter="handleClick"
		@keydown.space.prevent="handleClick"
		tabindex="0"
		role="button"
		:aria-label="`View details for ${domain.domain}`"
	>
		<VCardTitle class="text-center pb-2">
			<VTooltip
				:text="domain.domain"
				location="top"
			>
				<template #activator="{ props: tooltipProps }">
					<div v-bind="tooltipProps" class="domain-name">
						{{ domain.domain }}
					</div>
				</template>
			</VTooltip>
		</VCardTitle>
		<VDivider />
		<VCardText class="pa-0">
			<div class="stat-columns">
				<template v-if="showActive && showBackground">
					<ActivityStatColumn
						label="Active"
						:seconds="domain.active!.seconds"
						:percentChange="domain.active!.percentChange"
						:isNew="domain.isNew"
					/>
					<VDivider vertical />
					<ActivityStatColumn
						label="Background"
						:seconds="domain.background!.seconds"
						:percentChange="domain.background!.percentChange"
						:isNew="domain.isNew"
					/>
				</template>
				<template v-else-if="showActive">
					<ActivityStatColumn
						label="Active"
						:seconds="domain.active!.seconds"
						:percentChange="domain.active!.percentChange"
						:isNew="domain.isNew"
						class="single-column"
					/>
				</template>
				<template v-else-if="showBackground">
					<ActivityStatColumn
						label="Background"
						:seconds="domain.background!.seconds"
						:percentChange="domain.background!.percentChange"
						:isNew="domain.isNew"
						class="single-column"
					/>
				</template>
			</div>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ActivityStatColumn from './ActivityStatColumn.vue';

export interface ActivityStat {
	seconds: number;
	averageSeconds: number | null;
	percentChange: number | null;
}

export interface DomainSummary {
	domain: string;
	active: ActivityStat | null;
	background: ActivityStat | null;
	isNew: boolean;
}

interface Props {
	domain: DomainSummary;
}

interface Emits {
	(e: 'click', domain: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showActive = computed(() => props.domain.active !== null && props.domain.active.seconds > 0);
const showBackground = computed(() => props.domain.background !== null && props.domain.background.seconds > 0);

function handleClick() {
	emit('click', props.domain.domain);
}
</script>

<style scoped>
.domain-card {
	min-width: 200px;
	max-width: 300px;
	transition: transform 0.2s, box-shadow 0.2s;
}

.domain-card--clickable {
	cursor: pointer;
}

.domain-card--clickable:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

.domain-card--clickable:focus {
	outline: 2px solid rgb(var(--v-theme-primary));
	outline-offset: 2px;
}

.domain-name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 100%;
}

.stat-columns {
	display: flex;
	justify-content: center;
	align-items: stretch;
	min-height: 120px;
}

.single-column {
	flex: 1;
	display: flex;
	justify-content: center;
}
</style>
