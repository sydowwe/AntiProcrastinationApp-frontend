<template>
<VSnackbar class="mt-16" v-model="snackbar" :timeout :color location="top">
	{{ message }}
	<template v-if="closable" v-slot:actions>
		<v-btn color="white" variant="text" @click="hideSnackbar"> {{ $t('general.close') }}</v-btn>
	</template>
</VSnackbar>
</template>
<script setup lang="ts">

import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const {snackbar, color, message, timeout, closable, hideSnackbar} = useSnackbar();
</script>
