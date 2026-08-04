<template>
	<MyDialog
		v-model="open"
		:title="$t('reminderDashboard.snooze.title')"
		:confirmBtnLabel="$t('reminderDashboard.snooze.confirm')"
		confirmBtnColor="primary"
		:confirmBtnDisabled="!isValid || loading"
		@confirmed="onConfirm"
		@closed="onClosed"
	>
		<div class="d-flex flex-column ga-4 py-2">
			<p class="text-body-2 text-medium-emphasis mb-0">
				{{ $t('reminderDashboard.snooze.intro') }}
			</p>

			<InfoRow
				:label="$t('reminderDashboard.occurrence')"
				:value="formatInstant(occurrenceInstant)"
			/>

			<VRadioGroup
				v-model="choice"
				hideDetails
				density="comfortable"
			>
				<VRadio
					value="in1Hour"
					:label="$t('reminderDashboard.snooze.in1Hour')"
				/>
				<VRadio
					value="tomorrow"
					:label="$t('reminderDashboard.snooze.tomorrow')"
				/>
				<VRadio
					value="nextWeek"
					:label="$t('reminderDashboard.snooze.nextWeek')"
				/>
				<VRadio
					value="custom"
					:label="$t('reminderDashboard.snooze.custom')"
				/>
			</VRadioGroup>

			<DateTimePicker
				v-if="choice === 'custom'"
				v-model="customInstant"
				:label="$t('reminderDashboard.snooze.customLabel')"
				:minDate="now"
			/>

			<VAlert
				v-if="snoozeUntil && isValid"
				type="info"
				variant="tonal"
				density="compact"
			>
				{{ $t('reminderDashboard.snooze.willRemindAt', { time: formatInstant(snoozeUntil) }) }}
			</VAlert>
			<VAlert
				v-else-if="choice === 'custom'"
				type="warning"
				variant="tonal"
				density="compact"
			>
				{{ $t('reminderDashboard.snooze.mustBeFuture') }}
			</VAlert>
		</div>
	</MyDialog>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import InfoRow from '@/_common/component/feedback/InfoRow.vue'
	import DateTimePicker from '@/_common/component/dateTime/DateTimePicker.vue'
	import { useReminderFormat } from '@/core/reminders/composable/useReminderFormat.ts'

	const { occurrenceInstant, loading = false } = defineProps<{
		occurrenceInstant: Date
		loading?: boolean
	}>()

	const emit = defineEmits<{ confirmed: [snoozeUntil: Date] }>()

	const open = defineModel<boolean>({ required: true })
	const { formatInstant } = useReminderFormat()

	type SnoozeChoice = 'in1Hour' | 'tomorrow' | 'nextWeek' | 'custom'
	const choice = ref<SnoozeChoice>('in1Hour')
	const customInstant = ref<Date | null>(null)
	const now = ref(new Date())

	// The "remind me later" presets, relative to when the dialog was opened.
	function inOneHour(): Date {
		return new Date(now.value.getTime() + 60 * 60 * 1000)
	}

	function tomorrowMorning(): Date {
		const d = new Date(now.value)
		d.setDate(d.getDate() + 1)
		d.setHours(9, 0, 0, 0)
		return d
	}

	function nextWeek(): Date {
		return new Date(now.value.getTime() + 7 * 24 * 60 * 60 * 1000)
	}

	const snoozeUntil = computed<Date | null>(() => {
		switch (choice.value) {
			case 'in1Hour':
				return inOneHour()
			case 'tomorrow':
				return tomorrowMorning()
			case 'nextWeek':
				return nextWeek()
			case 'custom':
				return customInstant.value
			default:
				return null
		}
	})

	// Both the occurrence and the snooze-until must be in the future; the server also enforces this (400).
	const isValid = computed(() => snoozeUntil.value !== null && snoozeUntil.value.getTime() > Date.now())

	watch(open, isOpen => {
		if (isOpen) {
			now.value = new Date()
			choice.value = 'in1Hour'
			customInstant.value = null
		}
	})

	function onConfirm() {
		if (!isValid.value || snoozeUntil.value === null || loading) return
		emit('confirmed', snoozeUntil.value)
	}

	function onClosed() {
		choice.value = 'in1Hour'
		customInstant.value = null
	}
</script>
