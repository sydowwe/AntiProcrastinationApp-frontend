<template>
	<VIdAutocomplete
		v-model="model"
		v-model:search="search"
		:label
		:items="activityOptions"
		:loading
		:disabled
		required
		:rules="[requiredRule]"
	>
		<template #no-data>
			<VListItem
				link
				@click="openCreate"
			>
				<template #prepend>
					<VIcon
						icon="plus"
						size="16"
					/>
				</template>
				<VListItemTitle>
					{{
						search?.trim()
							? $t('leisure.createActivityNamed', { name: search })
							: $t('leisure.createActivity')
					}}
				</VListItemTitle>
			</VListItem>
		</template>
	</VIdAutocomplete>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import QuickCreateActivityDialog from '@/core/leisure/component/QuickCreateActivityDialog.vue'
	import type { Activity } from '@/core/activity/dto/response/Activity.ts'

	const { label, disabled = false } = defineProps<{ label: string; disabled?: boolean }>()
	const model = defineModel<number | null>({ required: true })

	const { t } = useI18n()
	const { requiredRule } = useGeneralRules()
	const { fetchSelectOptions } = useActivityCrud()
	const { openDialog } = useDialog()

	const activityOptions = ref<SelectOption[]>([])
	const loading = ref(false)
	const search = ref('')

	onMounted(async () => {
		loading.value = true
		activityOptions.value = await fetchSelectOptions()
		loading.value = false
	})

	async function openCreate() {
		const createdActivity = await openDialog<Activity>({
			component: QuickCreateActivityDialog,
			componentProps: { initialName: search.value ?? '' },
			dialogProps: { title: t('leisure.createActivity'), confirmBtnLabel: t('general.create') },
		})
		if (!createdActivity) return
		activityOptions.value = [...activityOptions.value, new SelectOption(createdActivity.id, createdActivity.name)]
		model.value = createdActivity.id
		search.value = ''
	}
</script>
