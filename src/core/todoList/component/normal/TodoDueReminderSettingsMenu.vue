<template>
	<!-- P1-02: the one to-do setting, the lead of a timed to-do's due reminder. Loaded when opened and
	     saved as it is edited, so there is no form state to lose. -->
	<VMenu
		v-model="open"
		:closeOnContentClick="false"
		location="bottom end"
	>
		<template #activator="{ props: activatorProps }">
			<VIconBtn
				v-bind="activatorProps"
				icon="bell"
				density="comfortable"
				variant="outlined"
				color="secondaryOutline"
				style="height: 40px; width: 40px"
				:title="$t('toDoList.dueReminders.settingsTitle')"
				:aria-label="$t('toDoList.dueReminders.settingsTitle')"
			/>
		</template>
		<VCard
			class="pa-4 d-flex flex-column ga-3"
			style="max-width: 360px"
		>
			<span class="text-subtitle-2">{{ $t('toDoList.dueReminders.settingsTitle') }}</span>
			<VNumberInput
				v-model="minutesBefore"
				:label="$t('toDoList.dueReminders.leadLabel')"
				:min="0"
				:max="MAX_DUE_REMINDER_MINUTES_BEFORE"
				:suffix="$t('toDoList.dueReminders.minutesSuffix')"
				:disabled="!loaded"
				hideDetails
				density="comfortable"
			/>
			<p class="text-body-2 text-medium-emphasis">
				{{ $t('toDoList.dueReminders.explainer') }}
			</p>
		</VCard>
	</VMenu>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { watchDebounced } from '@vueuse/core'
	import { useTodoListSettingsApi } from '@/core/todoList/api/todoListSettingsApi.ts'
	import { UserTodoListSettingsRequest } from '@/core/todoList/dto/request/UserTodoListSettingsRequest.ts'
	import {
		DEFAULT_DUE_REMINDER_MINUTES_BEFORE,
		MAX_DUE_REMINDER_MINUTES_BEFORE,
	} from '@/core/todoList/dto/response/UserTodoListSettings.ts'

	const { fetchSettings, updateSettings } = useTodoListSettingsApi()

	const open = ref(false)
	const loaded = ref(false)
	const minutesBefore = ref(DEFAULT_DUE_REMINDER_MINUTES_BEFORE)
	let savedMinutesBefore = DEFAULT_DUE_REMINDER_MINUTES_BEFORE

	// Fetched on every open rather than once: the value is server-owned and cheap, and another tab may
	// have changed it.
	watch(open, async isOpen => {
		if (!isOpen) return
		loaded.value = false
		const settings = await fetchSettings()
		savedMinutesBefore = settings.dueReminderMinutesBefore
		minutesBefore.value = settings.dueReminderMinutesBefore
		loaded.value = true
	})

	// Only a real change is written: each save re-registers every open timed to-do.
	watchDebounced(minutesBefore, save, { debounce: 500 })

	async function save() {
		const value = minutesBefore.value
		if (!loaded.value || value === null || value === savedMinutesBefore) return
		if (value < 0 || value > MAX_DUE_REMINDER_MINUTES_BEFORE) return
		await updateSettings(new UserTodoListSettingsRequest(value))
		savedMinutesBefore = value
	}
</script>
