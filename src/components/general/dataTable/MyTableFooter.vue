<template>
<div class="w-100 pb-2 px-3 d-flex flex-column flex-md-row justify-space-between align-center">
	<div class="d-flex ga-2 align-center">
		<VLabel>{{ $t('$vuetify.dataFooter.itemsPerPageText') }}</VLabel>
		<VSelect v-model="itemsPerPage" :items="mdAndDown ? [5, 10, 25, 50, -1] : [2, 25, 50, 100, -1]" hide-details></VSelect>
	</div>

	<div class="d-flex align-center  pagination-center">
		<VPagination v-model="page" total-visible="1" :length="paginationLength" show-first-last-page>
			<template v-slot:item="{page}">
				<div class="h-100 d-flex align-center justify-center">
					<h3 style="color: #444">{{ page }}</h3>
				</div>
			</template>
		</VPagination>
	</div>

	<div class="d-flex align-center ga-3">
		<span class="text-caption">{{ paginationText }}</span>
		<slot name="append"></slot>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useDisplay} from 'vuetify/framework';

const {mdAndDown} = useDisplay();
const {itemsLength} = defineProps<{
	itemsLength: number,
}>();

const itemsPerPage = defineModel<number>('itemsPerPage', {required: true});
const page = defineModel<number>('page', {required: true});

const paginationLength = computed(() => {
	if (itemsPerPage.value === -1) return 1;
	return Math.ceil(itemsLength / itemsPerPage.value);
});

const paginationText = computed(() => {
	if (itemsLength === 0) return '0 z 0';

	const itemsPerPageValue = itemsPerPage.value === -1 ? itemsLength : itemsPerPage.value;
	const from = (page.value - 1) * itemsPerPageValue + 1;
	const to = Math.min(page.value * itemsPerPageValue, itemsLength);

	return `${from}–${to} z ${itemsLength}`;
});
</script>

<style>
.text-caption {
	font-size: 0.875rem !important;
}


@media (min-width: 765px) {
	.pagination-center {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}
}
</style>