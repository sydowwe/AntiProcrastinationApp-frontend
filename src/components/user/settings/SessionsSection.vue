<template>
	<VCard
		elevation="2"
		color="surface"
		class="pa-4 d-flex flex-column ga-3"
	>
		<h3>{{ i18n.t('user.sessions') }}</h3>
		<VList
			v-if="sessions.length > 0"
			class="pa-0"
			color="secondary"
		>
			<VListItem
				v-for="session in sessions"
				:key="session.id"
				class="pa-2 mb-1"
				rounded="lg"
				color="neutral-200"
			>
				<template #title>
					<div class="d-flex align-center ga-2 flex-wrap">
						<span>{{ session.device }} · {{ session.browser }}</span>
						<VChip
							v-if="session.isCurrent"
							color="primary"
							size="x-small"
							density="compact"
						>
							{{ i18n.t('user.thisDevice') }}
						</VChip>
					</div>
				</template>
				<template #subtitle>
					<span class="text-medium-emphasis text-body-2">
						{{ session.ip }} · {{ i18n.t('user.lastUsed') }}: {{ fromNow(session.lastUsedAt) }}
					</span>
				</template>
				<template #append>
					<VBtn
						color="error"
						size="small"
						:disabled="session.isCurrent"
						:loading="revokingId === session.id"
						@click="revokeOne(session.id)"
					>
						{{ i18n.t('user.revokeSession') }}
					</VBtn>
				</template>
			</VListItem>
		</VList>
		<span
			v-else-if="!loading"
			class="text-medium-emphasis text-center py-2"
		>
			{{ i18n.t('user.noSessions') }}
		</span>
		<VProgressCircular
			v-if="loading"
			indeterminate
			class="mx-auto"
		/>
		<VBtn
			color="error"
			variant="tonal"
			:loading="revokingAll"
			@click="confirmRevokeAll = true"
		>
			{{ i18n.t('user.logOutAllOtherDevices') }}
		</VBtn>
		<MyDialog
			v-model="confirmRevokeAll"
			:title="i18n.t('user.logOutAllOtherDevices')"
			:text="i18n.t('user.logOutAllOtherDevicesConfirm')"
			confirmBtnColor="error"
			:confirmBtnLabel="i18n.t('general.confirm')"
			@confirmed="revokeAll"
		/>
	</VCard>
</template>
<script setup lang="ts">
	import { ref, onMounted } from 'vue'
	import { useI18n } from 'vue-i18n'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import { useSessionsApi } from '@/api/sessionsApi.ts'
	import type { UserSession } from '@/dtos/response/user/UserSession.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { handleHttpCodes } from '@/composables/general/ErrorHandlingFunctions.ts'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'

	dayjs.extend(relativeTime)

	const i18n = useI18n()
	const { fetchSessions, revokeSession, revokeAllOtherSessions } = useSessionsApi()
	const { showSuccessSnackbar } = useSnackbar()

	const sessions = ref<UserSession[]>([])
	const loading = ref(false)
	const revokingId = ref<string | null>(null)
	const revokingAll = ref(false)
	const confirmRevokeAll = ref(false)

	function fromNow(dateStr: string) {
		return dayjs(dateStr).fromNow()
	}

	async function loadSessions() {
		loading.value = true
		try {
			sessions.value = await fetchSessions()
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		} finally {
			loading.value = false
		}
	}

	async function revokeOne(id: string) {
		revokingId.value = id
		try {
			await revokeSession(id)
			sessions.value = sessions.value.filter(s => s.id !== id)
			showSuccessSnackbar(i18n.t('user.sessionRevoked'))
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		} finally {
			revokingId.value = null
		}
	}

	async function revokeAll() {
		confirmRevokeAll.value = false
		revokingAll.value = true
		try {
			await revokeAllOtherSessions()
			sessions.value = sessions.value.filter(s => s.isCurrent)
			showSuccessSnackbar(i18n.t('user.allOtherSessionsRevoked'))
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		} finally {
			revokingAll.value = false
		}
	}

	onMounted(loadSessions)
</script>
