<template>
	<VCard
		elevation="2"
		color="secondary"
		class="mt-3"
	>
		<VCardText class="pa-3 px-4">
			<div class="d-flex align-center ga-2 mb-2">
				<VIcon
					icon="folder-open"
					size="18"
				/>
				<span style="font-size: 1.07rem">{{ $t('employee.documents.myTitle') }}</span>
			</div>

			<VProgressLinear
				v-if="loading"
				indeterminate
				color="primary"
			/>

			<p
				v-else-if="documents.length === 0"
				class="text-medium-emphasis text-body-2 py-3 mb-0"
			>
				{{ $t('employee.documents.emptyEmployee') }}
			</p>

			<VTable
				v-else
				density="comfortable"
				class="bg-transparent"
			>
				<thead>
					<tr>
						<th>{{ $t('employee.documents.category') }}</th>
						<th>{{ $t('employee.documents.fileName') }}</th>
						<th>{{ $t('employee.documents.uploadedOn') }}</th>
						<th>{{ $t('employee.documents.expiryDate') }}</th>
						<th>{{ $t('employee.documents.size') }}</th>
						<th class="text-center">{{ $t('employee.documents.actions.download') }}</th>
					</tr>
				</thead>
				<tbody v-auto-animate>
					<tr
						v-for="doc in documents"
						:key="doc.id"
					>
						<td>
							<DocumentCategoryChip :category="doc.category" />
						</td>
						<td>{{ doc.fileName }}</td>
						<td>{{ formatToDate(doc.createdTimestamp) }}</td>
						<td>
							<DocumentExpiryCell :expiryDate="doc.expiryDate" />
						</td>
						<td>{{ formatFileSize(doc.fileSizeBytes) }}</td>
						<td class="text-center">
							<VIconBtn
								icon="download"
								variant="tonal"
								size="small"
								color="primaryOutline"
								:loading="downloadingId === doc.id"
								:title="$t('employee.documents.actions.download')"
								@click="onDownload(doc)"
							>
								<VIcon size="15" />
							</VIconBtn>
						</td>
					</tr>
				</tbody>
			</VTable>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import type { AxiosError } from 'axios'
	import { useI18n } from 'vue-i18n'
	import DocumentCategoryChip from '@/core/employee/employeeDocument/component/DocumentCategoryChip.vue'
	import DocumentExpiryCell from '@/core/employee/employeeDocument/component/DocumentExpiryCell.vue'
	import type { EmployeeDocumentResponse } from '@/core/employee/employeeDocument/dto/EmployeeDocument.ts'
	import {
		downloadEmployeeDocument,
		fetchMyDocuments,
	} from '@/core/employee/employeeDocument/api/EmployeeDocumentApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { formatToDate } from '@/_common/utils/DateTimeHelper.ts'
	import { formatFileSize } from '@/_common/utils/helperMethods.ts'
	import { downloadBlob } from '@/_common/utils/fileDownload.ts'

	const { t } = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const documents = ref<EmployeeDocumentResponse[]>([])
	const loading = ref(false)
	const downloadingId = ref<number | null>(null)

	async function loadDocuments() {
		loading.value = true
		try {
			documents.value = await fetchMyDocuments()
		} catch (e) {
			// A user with no linked employee record simply has no documents — stay silent on 403/404.
			const status = (e as AxiosError).response?.status ?? 0
			if (status !== 403 && status !== 404) {
				showErrorSnackbar(t('employee.documents.loadError'))
			}
		} finally {
			loading.value = false
		}
	}

	async function onDownload(doc: EmployeeDocumentResponse) {
		if (downloadingId.value !== null) return
		downloadingId.value = doc.id
		try {
			const { blob, fileName } = await downloadEmployeeDocument(doc.id)
			downloadBlob(blob, fileName ?? doc.fileName)
		} catch (e) {
			const status = (e as AxiosError).response?.status ?? 0
			if (status === 404) {
				showErrorSnackbar(t('employee.documents.errors.notAvailable'))
			} else if (status === 403) {
				showErrorSnackbar(t('employee.documents.errors.forbidden'))
			} else {
				showErrorSnackbar(t('employee.documents.errors.downloadError'))
			}
		} finally {
			downloadingId.value = null
		}
	}

	onMounted(loadDocuments)
</script>
