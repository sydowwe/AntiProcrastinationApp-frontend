<template>
	<VCard
		elevation="2"
		color="secondary"
		class="mt-3"
	>
		<VCardText class="pa-3 px-4">
			<div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
				<div class="d-flex align-center ga-2">
					<VIcon
						icon="file-shield"
						size="18"
					/>
					<span style="font-size: 1.07rem">{{ $t('employee.acknowledgment.my.title') }}</span>
				</div>
				<VSwitch
					v-model="showHistory"
					:label="$t('employee.acknowledgment.my.showHistory')"
					color="primary"
					hideDetails
					density="comfortable"
					@update:modelValue="onToggleHistory"
				/>
			</div>

			<VProgressLinear
				v-if="loading"
				indeterminate
				color="primary"
			/>

			<p
				v-else-if="items.length === 0"
				class="text-medium-emphasis text-body-2 py-3 mb-0"
			>
				{{ $t('employee.acknowledgment.my.empty') }}
			</p>

			<VTable
				v-else
				density="comfortable"
				class="bg-transparent"
			>
				<thead>
					<tr>
						<th>{{ $t('employee.acknowledgment.policy') }}</th>
						<th>{{ $t('employee.acknowledgment.category') }}</th>
						<th>{{ $t('employee.acknowledgment.currentVersion') }}</th>
						<th>{{ $t('employee.acknowledgment.status') }}</th>
						<th>{{ $t('employee.acknowledgment.expiryDate') }}</th>
						<th class="text-center">{{ $t('general.actions') }}</th>
					</tr>
				</thead>
				<tbody v-auto-animate>
					<tr
						v-for="row in items"
						:key="row.policyId"
					>
						<td>
							{{ row.policyName }}
							<ChipWithIcon
								v-if="row.isMandatory"
								vColor="warningDark"
								variant="tonal"
								size="x-small"
								class="ml-2"
								icon="shield-halved"
							>
								{{ $t('employee.acknowledgment.mandatory') }}
							</ChipWithIcon>
						</td>
						<td>{{ $t(`employee.policy.categoryEnum.${row.category}`) }}</td>
						<td>
							<span v-if="row.currentVersionLabel">{{ row.currentVersionLabel }}</span>
							<span
								v-else
								class="text-medium-emphasis"
							>
								{{ $t('employee.policy.noVersionYet') }}
							</span>
						</td>
						<td>
							<AcknowledgmentStatusChip :status="row.status" />
						</td>
						<td>
							<span
								v-if="!row.expiryDate"
								class="text-medium-emphasis"
							>
								—
							</span>
							<span v-else>{{ formatToDate(row.expiryDate) }}</span>
						</td>
						<td>
							<div class="d-flex justify-center ga-2">
								<VIconBtn
									icon="book-open"
									variant="tonal"
									size="small"
									color="primaryOutline"
									:disabled="row.currentVersionId === null"
									:loading="downloadingId === row.policyId"
									:title="$t('employee.acknowledgment.my.readDocument')"
									@click="onRead(row)"
								>
									<VIcon size="15" />
								</VIconBtn>
								<VBtn
									v-if="isOutstanding(row) && row.currentVersionId !== null"
									color="primary"
									size="small"
									prependIcon="signature"
									@click="openAcknowledge(row)"
								>
									{{ $t('employee.acknowledgment.my.acknowledge') }}
								</VBtn>
							</div>
						</td>
					</tr>
				</tbody>
			</VTable>

			<template v-if="showHistory">
				<VDivider class="my-4" />
				<div class="text-subtitle-2 mb-2">{{ $t('employee.acknowledgment.my.historyTitle') }}</div>

				<VProgressLinear
					v-if="historyLoading"
					indeterminate
					color="primary"
				/>
				<p
					v-else-if="history.length === 0"
					class="text-medium-emphasis text-body-2 py-2 mb-0"
				>
					{{ $t('employee.acknowledgment.my.historyEmpty') }}
				</p>
				<VTable
					v-else
					density="comfortable"
					class="bg-transparent"
				>
					<thead>
						<tr>
							<th>{{ $t('employee.acknowledgment.policy') }}</th>
							<th>{{ $t('employee.acknowledgment.version') }}</th>
							<th>{{ $t('employee.acknowledgment.method') }}</th>
							<th>{{ $t('employee.acknowledgment.acknowledgedDate') }}</th>
							<th>{{ $t('employee.acknowledgment.expiryDate') }}</th>
						</tr>
					</thead>
					<tbody v-auto-animate>
						<tr
							v-for="row in history"
							:key="row.id"
						>
							<td>{{ row.policyName }}</td>
							<td>{{ row.versionLabel }}</td>
							<td>{{ $t(`employee.acknowledgment.methodEnum.${row.method}`) }}</td>
							<td>{{ formatToDate(row.acknowledgedDate) }}</td>
							<td>
								<span
									v-if="!row.expiryDate"
									class="text-medium-emphasis"
								>
									—
								</span>
								<span v-else>{{ formatToDate(row.expiryDate) }}</span>
							</td>
						</tr>
					</tbody>
				</VTable>
			</template>
		</VCardText>
	</VCard>

	<AcknowledgeDialog
		v-model="dialogOpen"
		:policy="policyToAck"
		:saving
		@confirmed="onAcknowledge"
	/>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import type { AxiosError } from 'axios'
	import { useI18n } from 'vue-i18n'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import AcknowledgmentStatusChip from '@/core/employee/acknowledgment/component/AcknowledgmentStatusChip.vue'
	import AcknowledgeDialog from '@/core/employee/acknowledgment/component/AcknowledgeDialog.vue'
	import {
		type AcknowledgmentLedgerResponse,
		AcknowledgmentStatus,
		type CreateAcknowledgmentRequest,
		type MyRequiredPolicyResponse,
	} from '@/core/employee/acknowledgment/dto/Acknowledgment.ts'
	import {
		createAcknowledgment,
		getMyAcknowledgments,
		getMyRequiredPolicies,
	} from '@/core/employee/acknowledgment/api/AcknowledgmentApi.ts'
	import { downloadPolicyVersion } from '@/core/employee/policy/api/PolicyApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { formatToDate } from '@/_common/utils/DateTimeHelper.ts'
	import { downloadBlob } from '@/_common/utils/fileDownload.ts'

	const { t } = useI18n()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const items = ref<MyRequiredPolicyResponse[]>([])
	const loading = ref(false)
	const downloadingId = ref<number | null>(null)
	const saving = ref(false)

	const dialogOpen = ref(false)
	const policyToAck = ref<MyRequiredPolicyResponse | null>(null)

	const showHistory = ref(false)
	const history = ref<AcknowledgmentLedgerResponse[]>([])
	const historyLoading = ref(false)

	function isOutstanding(row: MyRequiredPolicyResponse): boolean {
		return row.status !== AcknowledgmentStatus.Valid
	}

	async function loadItems() {
		loading.value = true
		try {
			items.value = await getMyRequiredPolicies()
		} catch (e) {
			// A user with no linked employee record simply has nothing to acknowledge — stay silent on 403.
			const status = (e as AxiosError).response?.status ?? 0
			if (status !== 403 && status !== 404) {
				showErrorSnackbar(t('employee.acknowledgment.my.loadError'))
			}
		} finally {
			loading.value = false
		}
	}

	async function loadHistory() {
		historyLoading.value = true
		try {
			history.value = await getMyAcknowledgments()
		} catch {
			history.value = []
		} finally {
			historyLoading.value = false
		}
	}

	function onToggleHistory(open: boolean | null) {
		if (open && history.value.length === 0) loadHistory()
	}

	async function onRead(row: MyRequiredPolicyResponse) {
		if (row.currentVersionId === null || downloadingId.value !== null) return
		downloadingId.value = row.policyId
		try {
			const { blob, fileName } = await downloadPolicyVersion(row.currentVersionId)
			downloadBlob(blob, fileName ?? `${row.policyName}.pdf`)
		} catch (e) {
			const status = (e as AxiosError).response?.status ?? 0
			if (status === 403) {
				showErrorSnackbar(t('employee.acknowledgment.errors.notAssigned'))
			} else if (status === 410) {
				showErrorSnackbar(t('employee.policy.version.errors.fileGone'))
			} else if (status === 404) {
				showErrorSnackbar(t('employee.policy.version.errors.fileNotFound'))
			} else {
				showErrorSnackbar(t('employee.policy.version.downloadError'))
			}
		} finally {
			downloadingId.value = null
		}
	}

	function openAcknowledge(row: MyRequiredPolicyResponse) {
		policyToAck.value = row
		dialogOpen.value = true
	}

	async function onAcknowledge(data: CreateAcknowledgmentRequest) {
		saving.value = true
		try {
			await createAcknowledgment(data)
			showSuccessSnackbar(t('employee.acknowledgment.acknowledge.success'))
			dialogOpen.value = false
			await loadItems()
			if (showHistory.value) await loadHistory()
		} catch (e) {
			const status = (e as AxiosError).response?.status ?? 0
			if (status === 422) {
				showErrorSnackbar(t('employee.acknowledgment.acknowledge.nameMismatch'))
			} else if (status === 409) {
				// Acted on a non-current version (a guard) — the list moved on; refresh it.
				showErrorSnackbar(t('employee.acknowledgment.errors.nonCurrentVersion'))
				dialogOpen.value = false
				await loadItems()
			} else {
				showErrorSnackbar(t('employee.acknowledgment.acknowledge.error'))
			}
		} finally {
			saving.value = false
		}
	}

	onMounted(loadItems)
</script>
