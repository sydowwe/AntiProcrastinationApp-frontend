<template>
<VBtnToggle
	v-model="model"
	mandatory
	variant="outlined"
	color="secondaryOutline"
	style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
>
	<VBtn :value="HistoryGroupBy.Activity" height="40px">Activity</VBtn>
	<VBtn :value="HistoryGroupBy.Role" height="40px">Role</VBtn>
	<VBtn :value="HistoryGroupBy.Category" height="40px">Category</VBtn>
</VBtnToggle>
</template>

<script setup lang="ts">
import {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

const model = defineModel<HistoryGroupBy>({required: true})
</script>
