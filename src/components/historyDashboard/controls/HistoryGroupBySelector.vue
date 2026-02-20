<template>
<VBtnToggle
	v-model="model"
	mandatory
	variant="outlined"
	color="secondaryOutline"
	style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 48px"
>
	<VBtn :value="HistoryGroupBy.Activity" height="48px">Activity</VBtn>
	<VBtn :value="HistoryGroupBy.Role" height="48px">Role</VBtn>
	<VBtn :value="HistoryGroupBy.Category" height="48px">Category</VBtn>
</VBtnToggle>
</template>

<script setup lang="ts">
import {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

const model = defineModel<HistoryGroupBy>({required: true})
</script>
