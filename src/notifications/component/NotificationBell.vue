<template>
	<VMenu
		location="bottom end"
		:closeOnContentClick="false"
		maxWidth="400"
	>
		<template #activator="{ props: menuProps }">
			<VBadge
				:content="unreadCount"
				:modelValue="unreadCount > 0"
				:max="99"
				color="error"
			>
				<VIconBtn
					icon="bell"
					size="35"
					variant="text"
					color="on-surface"
					:title="$t('notifications.title')"
					v-bind="menuProps"
				/>
			</VBadge>
		</template>

		<VCard
			minWidth="340"
			maxWidth="400"
		>
			<VCardItem class="py-2">
				<VCardTitle class="text-subtitle-1">{{ $t('notifications.title') }}</VCardTitle>
				<template #append>
					<VBtn
						v-if="unreadCount > 0"
						variant="text"
						size="small"
						@click="markAllRead"
					>
						{{ $t('notifications.markAllRead') }}
					</VBtn>
				</template>
			</VCardItem>
			<VDivider />
			<VList
				density="comfortable"
				maxHeight="60vh"
				class="overflow-y-auto py-0"
			>
				<template v-if="notifications.length > 0">
					<VListItem
						v-for="notification in notifications"
						:key="notification.id"
						:class="{ 'bg-primary-container': !notification.isRead }"
						lines="two"
						@click="onItemClick(notification)"
					>
						<template #prepend>
							<VIcon
								:icon="notificationIcon(notification.type)"
								:color="
									notification.isRead
										? 'textMuted'
										: (notificationIconColor(notification.type) ?? 'primary')
								"
							/>
						</template>
						<VListItemTitle class="text-wrap font-weight-medium">{{ notification.title }}</VListItemTitle>
						<VListItemSubtitle class="text-wrap">{{ notification.body }}</VListItemSubtitle>
						<template #append>
							<span class="text-caption text-textMuted">{{ formattedTimes.get(notification.id) }}</span>
						</template>
					</VListItem>
				</template>
				<VListItem v-else>
					<VListItemTitle class="text-center text-textMuted py-4">
						{{ $t('notifications.empty') }}
					</VListItemTitle>
				</VListItem>
			</VList>
		</VCard>
	</VMenu>
</template>

<script setup lang="ts">
	import { computed, onMounted, onUnmounted } from 'vue'
	import { useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import 'dayjs/locale/sk'
	import 'dayjs/locale/en'
	import { useNotifications } from '@/core/notifications/composable/useNotifications.ts'
	import type { NotificationResponse } from '@/core/notifications/dto/NotificationResponse.ts'
	import {
		notificationIcon,
		notificationIconColor,
		notificationRoute,
	} from '@/core/notifications/utils/notificationTypeMeta.ts'
	import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'

	dayjs.extend(relativeTime)

	const router = useRouter()
	const { locale } = useI18n()
	const { notifications, unreadCount, connect, disconnect, markRead, markAllRead } = useNotifications()
	const { currentTime } = useCurrentTime()

	onMounted(connect)
	onUnmounted(disconnect)

	// Re-maps every notification to its relative time whenever `currentTime` ticks
	// (each minute via useCurrentTime) or the locale changes, so timestamps stay fresh
	// while the menu is open instead of freezing at their first-render value. Comparing
	// against `currentTime` explicitly (rather than the implicit `now` of `fromNow()`)
	// makes the tick a real input to the result.
	const formattedTimes = computed(() => {
		const lang = locale.value.toLowerCase()
		const now = dayjs(currentTime.value)
		return new Map(
			notifications.value.map(notification => [
				notification.id,
				dayjs(notification.createdAt).locale(lang).from(now),
			]),
		)
	})

	function onItemClick(notification: NotificationResponse): void {
		markRead(notification.id)
		const route = notificationRoute(notification.type)
		if (route !== undefined) router.push(route)
	}
</script>
