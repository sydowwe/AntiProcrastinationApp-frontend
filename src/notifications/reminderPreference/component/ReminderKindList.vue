<template>
	<VCard
		elevation="2"
		color="secondary"
	>
		<VCardItem>
			<template #prepend>
				<VIcon
					icon="bell-slash"
					color="primary"
				/>
			</template>
			<VCardTitle>{{ i18n.t('reminderPreference.kind.title') }}</VCardTitle>
			<VCardSubtitle class="text-wrap">{{ i18n.t('reminderPreference.kind.subtitle') }}</VCardSubtitle>
		</VCardItem>
		<VCardText>
			<div
				v-if="preferences.length === 0"
				class="d-flex flex-column align-center text-center text-medium-emphasis py-6 ga-2"
			>
				<VIcon
					icon="bell"
					size="32"
				/>
				<span>{{ i18n.t('reminderPreference.kind.empty') }}</span>
			</div>
			<div
				v-else
				v-auto-animate
			>
				<template
					v-for="(preference, index) in preferences"
					:key="`${preference.ownerModule}:${preference.kind}`"
				>
					<VDivider v-if="index > 0" />
					<ReminderKindRow
						:preference
						@updated="onUpdated"
					/>
				</template>
			</div>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import ReminderKindRow from '@/core/notifications/reminderPreference/component/ReminderKindRow.vue'
	import type { ReminderKindPreference } from '@/core/notifications/reminderPreference/dto/response/ReminderKindPreference.ts'

	const { preferences } = defineProps<{ preferences: ReminderKindPreference[] }>()

	const emit = defineEmits<{ updated: [preference: ReminderKindPreference] }>()

	const i18n = useI18n()

	function onUpdated(preference: ReminderKindPreference): void {
		emit('updated', preference)
	}
</script>
