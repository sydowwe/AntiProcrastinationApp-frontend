<template>
	<div class="cell-content">
		<!-- Wake/Bed Time — always present on a real row (B2); absent days carry no sleep data -->
		<div
			v-if="day.hasRecord"
			class="cell-info"
		>
			<VIcon
				icon="fas fa-bed"
				size="small"
				class="mr-1"
			/>
			<span class="info-text">{{ day.wakeUpTime.getString() }} - {{ day.bedTime.getString() }}</span>
		</div>

		<!-- Total tracked time + session count -->
		<div
			v-if="day.totalSeconds > 0"
			class="cell-info total-time"
		>
			<VIcon
				icon="fas fa-clock"
				size="small"
				class="mr-1"
			/>
			<span class="info-text font-weight-bold">{{ fromSeconds(day.totalSeconds) }}</span>
			<VChip
				size="x-small"
				variant="tonal"
				class="ml-1"
			>
				{{ $t('history.calendar.sessions', { count: day.sessionCount }, day.sessionCount) }}
			</VChip>
		</div>

		<!-- Top roles -->
		<div
			v-if="day.topRoles.length"
			class="roles-list"
		>
			<div
				v-for="role in day.topRoles"
				:key="role.roleName"
				class="role-item"
			>
				<div
					class="role-color-dot"
					:style="{ backgroundColor: role.color ?? 'rgb(var(--v-theme-primary))' }"
				/>
				<span class="role-name">{{ role.roleName }}</span>
				<span class="role-time">{{ fromSeconds(role.totalSeconds) }}</span>
			</div>
		</div>

		<!-- No calendar row at all — distinct from a row that simply has no activity -->
		<div
			v-if="!day.hasRecord"
			class="cell-info no-record"
		>
			<VIcon
				icon="fas fa-circle-question"
				size="small"
				class="mr-1"
			/>
			<span class="info-text">{{ $t('history.calendar.notRecorded') }}</span>
		</div>

		<!-- No activity data -->
		<div
			v-else-if="day.totalSeconds === 0"
			class="cell-info no-data"
		>
			<span class="info-text opacity-50">{{ $t('history.calendar.noActivity') }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { CalendarActivityDaySummary } from '@/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'

	defineProps<{
		day: CalendarActivityDaySummary
	}>()
</script>

<style scoped>
	.cell-content {
		flex: 1;
		padding: 8px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.cell-info {
		display: flex;
		align-items: center;
		font-size: 13px;
		color: rgb(var(--v-theme-on-surface));
		line-height: 1.5;
		gap: 4px;
	}

	.cell-info.no-record {
		font-style: italic;
		opacity: 0.4;
	}

	.cell-info.total-time {
		padding: 4px 8px;
		background-color: rgba(var(--v-border-color), 0.12);
		border-radius: 6px;
		border: 1px solid rgba(var(--v-border-color), 0.15);
	}

	.roles-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.role-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		line-height: 1.4;
		padding: 1px 0;
	}

	.role-color-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.role-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.role-time {
		flex-shrink: 0;
		font-weight: 600;
		opacity: 0.8;
	}

	.info-text {
		flex: 1;
	}

	@media (max-width: 960px) {
		.cell-content {
			padding: 6px;
			gap: 4px;
		}

		.cell-info {
			font-size: 12px;
		}

		.role-item {
			font-size: 11px;
		}
	}

	@media (max-width: 600px) {
		.cell-content {
			padding: 4px;
			gap: 3px;
		}

		.cell-info {
			font-size: 11px;
		}

		.role-item {
			font-size: 10px;
		}
	}
</style>
