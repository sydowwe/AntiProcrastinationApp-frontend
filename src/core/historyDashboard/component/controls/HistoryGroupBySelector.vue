<template>
	<MyBtnToggle
		v-model="model"
		:label="$t('historyDashboard.summaryCards.groupBy')"
		mandatory
		variant="outlined"
		color="secondaryOutline"
		style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
	>
		<VBtn
			:value="HistoryGroupBy.Activity"
			height="40px"
		>
			{{ $t('activities.activity') }}
		</VBtn>
		<VBtn
			:value="HistoryGroupBy.Role"
			height="40px"
		>
			{{ $t('activities.role') }}
		</VBtn>
		<VBtn
			:value="HistoryGroupBy.Category"
			height="40px"
		>
			{{ $t('activities.category') }}
		</VBtn>
	</MyBtnToggle>
</template>

<script setup lang="ts">
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'

	const model = defineModel<HistoryGroupBy>({ required: true })
</script>
