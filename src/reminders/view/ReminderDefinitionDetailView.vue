<template>
	<VContainer
		fluid
		class="d-flex flex-column ga-4"
	>
		<template v-if="isAdmin">
			<div class="d-flex align-center justify-space-between flex-wrap ga-3">
				<VBtn
					variant="text"
					prependIcon="arrow-left"
					:to="{ name: 'reminderDefinitions' }"
				>
					{{ $t('general.backToList') }}
				</VBtn>
				<div
					v-if="reminder"
					class="d-flex align-center ga-3 flex-wrap"
				>
					<ReminderStatusChip :status="reminder.status" />
					<span class="text-h6 font-monospace">{{ reminder.kind }}</span>
				</div>
				<ReminderActionButtons
					v-if="reminder"
					:reminderKey="reminderKey!"
					:status="reminder.status"
					@statusChanged="loadReminder"
				/>
			</div>

			<template v-if="reminder">
				<!-- Key -->
				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('reminders.key.title') }}</div>
					<div class="reminder-info-grid">
						<InfoRow
							:label="$t('reminders.key.ownerModule')"
							:value="reminder.ownerModule"
						/>
						<InfoRow
							:label="$t('reminders.key.subjectType')"
							:value="reminder.subjectType"
						/>
						<InfoRow
							:label="$t('reminders.key.subjectId')"
							:value="reminder.subjectId"
						/>
						<InfoRow
							:label="$t('reminders.key.kind')"
							:value="reminder.kind"
						/>
					</div>
				</VCard>

				<!-- Lifecycle -->
				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('reminders.lifecycle.title') }}</div>
					<div class="reminder-info-grid">
						<InfoRow :label="$t('reminders.field.status')">
							<ReminderStatusChip :status="reminder.status" />
						</InfoRow>
						<InfoRow
							:label="$t('reminders.field.nextOccurrence')"
							:value="formatInstant(reminder.nextOccurrenceAt)"
						/>
						<InfoRow
							:label="$t('reminders.field.lastOccurrence')"
							:value="formatInstant(reminder.lastOccurrenceAt)"
						/>
						<InfoRow
							:label="$t('reminders.field.completedAt')"
							:value="formatInstant(reminder.completedAt)"
						/>
					</div>
				</VCard>

				<!-- Schedule (conditional on type) -->
				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="d-flex align-center ga-2 mb-3">
						<span class="text-subtitle-1 font-weight-medium">{{ $t('reminders.schedule.title') }}</span>
						<ReminderScheduleDisplay
							:scheduleType="reminder.scheduleType"
							:cronExpression="reminder.cronExpression"
							:intervalPreset="reminder.intervalPreset"
							:dueAt="reminder.dueAt"
						/>
					</div>

					<!-- One-shot -->
					<div
						v-if="reminder.scheduleType === ReminderScheduleType.OneShot"
						class="reminder-info-grid"
					>
						<InfoRow
							:label="$t('reminders.schedule.dueAt')"
							:value="formatInstant(reminder.dueAt)"
						/>
						<InfoRow :label="$t('reminders.schedule.leadOffsets')">
							<div
								v-if="reminder.leadOffsetMinutes.length"
								class="d-flex flex-wrap ga-2"
							>
								<ChipWithIcon
									v-for="offset in reminder.leadOffsetMinutes"
									:key="offset"
									icon="clock"
									color="secondaryOutline"
									size="small"
								>
									{{ formatLeadOffset(offset) }}
								</ChipWithIcon>
							</div>
							<span
								v-else
								class="info-row__value text-medium-emphasis"
							>
								—
							</span>
						</InfoRow>
					</div>

					<!-- Recurring interval -->
					<div
						v-else-if="reminder.scheduleType === ReminderScheduleType.RecurringInterval"
						class="reminder-info-grid"
					>
						<InfoRow :label="$t('reminders.schedule.interval')">
							<span class="info-row__value">
								{{
									reminder.intervalPreset
										? $t(`reminders.intervalPreset.${reminder.intervalPreset}`)
										: '—'
								}}
							</span>
						</InfoRow>
						<InfoRow
							:label="$t('reminders.schedule.anchorDate')"
							:value="formatInstant(reminder.anchorDate)"
						/>
						<InfoRow
							:label="$t('reminders.schedule.endDate')"
							:value="formatInstant(reminder.endDate)"
						/>
					</div>

					<!-- Recurring cron -->
					<div
						v-else
						class="reminder-info-grid"
					>
						<InfoRow :label="$t('reminders.schedule.cronExpression')">
							<code class="schedule-cron">{{ reminder.cronExpression ?? '—' }}</code>
						</InfoRow>
						<InfoRow
							:label="$t('reminders.schedule.endDate')"
							:value="formatInstant(reminder.endDate)"
						/>
					</div>
				</VCard>

				<!-- Recipients -->
				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('reminders.recipients.title') }}</div>
					<div v-if="reminder.resolverKey">
						<InfoRow :label="$t('reminders.recipients.resolverKey')">
							<div class="d-flex align-center ga-2">
								<code class="schedule-cron">{{ reminder.resolverKey }}</code>
								<span class="text-caption text-medium-emphasis">
									{{ $t('reminders.recipients.resolvedAtSendTime') }}
								</span>
							</div>
						</InfoRow>
					</div>
					<div v-else-if="reminder.recipientUserIds && reminder.recipientUserIds.length">
						<InfoRow :label="$t('reminders.recipients.explicitUsers')">
							<div class="d-flex flex-wrap ga-2">
								<ChipWithIcon
									v-for="userId in reminder.recipientUserIds"
									:key="userId"
									icon="user"
									color="secondaryOutline"
									size="small"
								>
									#{{ userId }}
								</ChipWithIcon>
							</div>
						</InfoRow>
					</div>
					<span
						v-else
						class="text-medium-emphasis"
					>
						{{ $t('reminders.recipients.none') }}
					</span>
				</VCard>

				<!-- Content -->
				<VCard
					rounded="lg"
					class="pa-4"
				>
					<div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('reminders.content.title') }}</div>
					<div class="reminder-info-grid mb-3">
						<InfoRow
							:label="$t('reminders.content.templateKey')"
							:value="reminder.templateKey ?? '—'"
						/>
						<InfoRow
							:label="$t('reminders.content.notificationType')"
							:value="reminder.notificationType ?? '—'"
						/>
						<InfoRow
							v-if="reminder.digestKey"
							:label="$t('reminders.content.digestKey')"
							:value="reminder.digestKey"
						/>
						<InfoRow
							v-if="reminder.preferredChannel"
							:label="$t('reminders.content.preferredChannel')"
							:value="reminder.preferredChannel"
						/>
					</div>
					<div>
						<div class="info-row__label mb-1">{{ $t('reminders.content.payload') }}</div>
						<pre
							v-if="payloadText"
							class="payload-block"
							>{{ payloadText }}</pre
						>
						<span
							v-else
							class="text-medium-emphasis"
						>
							{{ $t('reminders.content.noPayload') }}
						</span>
					</div>
				</VCard>
			</template>

			<div
				v-else-if="loading"
				class="d-flex justify-center pa-8"
			>
				<VProgressCircular
					indeterminate
					color="primary"
				/>
			</div>
		</template>

		<VCard
			v-else
			class="pa-6 text-center"
		>
			<p class="text-error">{{ $t('general.forbidden') }}</p>
		</VCard>
	</VContainer>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import ReminderStatusChip from '@/core/reminders/component/ReminderStatusChip.vue'
	import ReminderScheduleDisplay from '@/core/reminders/component/ReminderScheduleDisplay.vue'
	import ReminderActionButtons from '@/core/reminders/component/ReminderActionButtons.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import InfoRow from '@/_common/component/feedback/InfoRow.vue'
	import { ReminderScheduleType } from '@/core/reminders/dto/enum/ReminderScheduleType.ts'
	import { ReminderKeyRequest } from '@/core/reminders/dto/request/ReminderKeyRequest.ts'
	import type { ReminderDefinitionResponse } from '@/core/reminders/dto/response/ReminderDefinitionResponse.ts'
	import { useReminderDefinitionQuery } from '@/core/reminders/api/ReminderDefinitionApi.ts'
	import { useReminderFormat } from '@/core/reminders/composable/useReminderFormat.ts'
	import { useSetBreadcrumbExtra } from '@/_common/composable/general/useBreadcrumbs.ts'
	import { useAuthStore } from '@/core/user/store/authStore.ts'

	const { id } = defineProps<{ id: string }>()

	const i18n = useI18n()
	const authStore = useAuthStore()
	const { formatInstant, formatLeadOffset, formatPayload } = useReminderFormat()
	const { fetchById } = useReminderDefinitionQuery()

	const isAdmin = computed(() => authStore.isAdminRole())
	const loading = ref(false)
	const reminder = ref<ReminderDefinitionResponse | null>(null)

	const reminderKey = computed<ReminderKeyRequest | null>(() =>
		reminder.value
			? new ReminderKeyRequest(
					reminder.value.ownerModule,
					reminder.value.subjectType,
					reminder.value.subjectId,
					reminder.value.kind,
				)
			: null,
	)

	const payloadText = computed(() => formatPayload(reminder.value?.payload))

	async function loadReminder() {
		loading.value = true
		try {
			reminder.value = await fetchById(Number(id))
		} finally {
			loading.value = false
		}
	}

	// The register list is not a nav path, so supply its crumb explicitly.
	const registerCrumb = { title: i18n.t('navigation.reminderDefinitions'), to: '/pripomienky/register' }
	const { setBreadcrumbExtra } = useSetBreadcrumbExtra()
	watch(reminder, value => {
		setBreadcrumbExtra(value ? [registerCrumb, { title: value.kind }] : [registerCrumb])
	})

	onMounted(loadReminder)
</script>

<style scoped>
	.reminder-info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
	}

	.font-monospace {
		font-family: monospace;
	}

	.schedule-cron {
		font-family: monospace;
		font-size: 0.8125rem;
		background: rgba(var(--v-theme-on-surface), 0.07);
		padding: 1px 6px;
		border-radius: 4px;
	}

	.info-row__label {
		font-size: 0.75rem;
		color: rgba(var(--v-theme-on-surface), 0.6);
	}

	.payload-block {
		font-family: monospace;
		font-size: 0.8125rem;
		background: rgba(var(--v-theme-on-surface), 0.05);
		padding: 12px;
		border-radius: 6px;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
		margin: 0;
	}
</style>
