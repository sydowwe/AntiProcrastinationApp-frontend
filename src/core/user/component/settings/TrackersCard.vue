<template>
	<VCard
		variant="outlined"
		color="secondaryOutline"
		class="pa-3 d-flex flex-column ga-2"
	>
		<div class="d-flex align-center ga-2">
			<VIcon icon="satellite-dish" />
			<span>{{ i18n.t('user.trackers.title') }}</span>
		</div>
		<p class="text-body-2 text-medium-emphasis ma-0">{{ i18n.t('user.trackers.intro') }}</p>
		<VList
			class="pa-0"
			density="compact"
			bgColor="transparent"
		>
			<VListItem
				v-for="tracker in trackerKinds"
				:key="tracker.key"
				:prependIcon="tracker.icon"
				:title="i18n.t(`user.trackers.${tracker.key}.name`)"
				:subtitle="i18n.t(`user.trackers.${tracker.key}.records`)"
				lines="two"
				class="px-1"
			/>
		</VList>
		<p class="text-body-2 text-medium-emphasis ma-0">
			{{ i18n.t('user.trackers.sensitive') }}
			<RouterLink
				:to="{ name: 'legalPrivacy' }"
				class="text-primary"
			>
				{{ i18n.t('user.trackers.privacyLink') }}
			</RouterLink>
		</p>

		<VDivider />

		<span class="text-subtitle-2">{{ i18n.t('user.trackers.signedIn') }}</span>
		<VProgressCircular
			v-if="loading"
			indeterminate
			size="24"
			class="mx-auto"
		/>
		<span
			v-else-if="trackers.length === 0"
			class="text-body-2 text-medium-emphasis"
		>
			{{ i18n.t('user.trackers.none') }}
		</span>
		<VList
			v-else
			class="pa-0"
			density="compact"
			bgColor="transparent"
		>
			<VListItem
				v-for="session in trackers"
				:key="session.id"
				:title="deviceLabel(session)"
				:subtitle="whenLabel(session)"
				lines="two"
				class="px-1"
			>
				<template #append>
					<VBtn
						color="errorDark"
						size="small"
						:loading="revokingId === session.id"
						@click="revoke(session.id)"
					>
						{{ i18n.t('user.trackers.signOut') }}
					</VBtn>
				</template>
			</VListItem>
		</VList>
	</VCard>
</template>
<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import { useSessionsApi } from '@/_common/modules/user/api/sessionsApi.ts'
	import type { UserSession } from '@/_common/modules/user/dto/response/UserSession.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { handleHttpCodes } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { formatToDate, formatToTime } from '@/_common/utils/DateTimeHelper.ts'

	// FO7: every account may sign a tracker in now, so the page that holds the account says what a
	// tracker records and lets the user sign one out. A tracker session is an ordinary session with
	// `isExtensionClient` set, so the framework's `SessionsSection` lists it too (with an "App" chip);
	// signing out here is the same revoke, and that list drops the row on its own 404.
	dayjs.extend(relativeTime)

	const i18n = useI18n()
	const { fetchSessions, revokeSession } = useSessionsApi()
	const { showSuccessSnackbar } = useSnackbar()

	// The three clients `/auth/extension/login` serves. What each records is the same wording as the
	// privacy policy's sections 4 and 5 — change both together.
	const trackerKinds = [
		{ key: 'desktop', icon: 'desktop' },
		{ key: 'android', icon: 'fa-brands fa-android' },
		{ key: 'browser', icon: 'puzzle-piece' },
	]

	const sessions = ref<UserSession[]>([])
	const loading = ref(true)
	const revokingId = ref<string | null>(null)

	const trackers = computed(() => sessions.value.filter(s => s.isExtensionClient))

	// The server parses the user agent and answers 'Unknown' for what it cannot place, which a
	// desktop tracker's agent mostly is. Show what it did place, and a plain noun when nothing.
	function deviceLabel(session: UserSession) {
		const parts = [session.device, session.browser].filter(p => p && p !== 'Unknown')
		return parts.length > 0 ? parts.join(' · ') : i18n.t('user.trackers.unknownDevice')
	}

	function whenLabel(session: UserSession) {
		const lastUsed = `${i18n.t('user.lastUsed')}: ${dayjs(session.lastUsedAt).fromNow()}`
		if (!session.createdAt) return lastUsed
		const signedIn = new Date(session.createdAt)
		return `${i18n.t('user.signedIn')}: ${formatToDate(signedIn)} ${formatToTime(signedIn)} · ${lastUsed}`
	}

	async function load() {
		try {
			sessions.value = await fetchSessions()
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		} finally {
			loading.value = false
		}
	}

	async function revoke(id: string) {
		revokingId.value = id
		try {
			await revokeSession(id)
			sessions.value = sessions.value.filter(s => s.id !== id)
			showSuccessSnackbar(i18n.t('user.trackers.signedOut'))
		} catch (e: any) {
			// Already ended — signed out from the sessions list below, or expired. Same outcome.
			if (e.response?.status === 404) sessions.value = sessions.value.filter(s => s.id !== id)
			else handleHttpCodes(e.response?.status)
		} finally {
			revokingId.value = null
		}
	}

	load()
</script>
