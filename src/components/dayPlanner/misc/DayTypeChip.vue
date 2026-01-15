<template>
<VChip
	:color="getDayTypeColor(dayType, isTonal)"
	:variant="isTonal ? 'tonal' : 'flat'"
	size="small"
	:style="!isTonal ? 'color: white!important;' : ''"
>
	<VIcon :icon="getDayTypeIcon(dayType)" class="mr-1"/>
	{{ dayType }}
</VChip>
</template>

<script setup lang="ts">
import {DayType, getDayTypeColor, getDayTypeIcon} from '@/dtos/enum/DayType.ts';

const {} = defineProps<{
	dayType: DayType
	isTonal: boolean
}>();
</script>

<style scoped>

</style>