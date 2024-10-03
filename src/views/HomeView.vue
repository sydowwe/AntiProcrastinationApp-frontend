<template>
<div>
	<MyDialog v-model="dialog" title="Dialog" ></MyDialog>
	<VBtn @click="dialog = !dialog" size="large">Click me</VBtn>
</div>
</template>
<script setup lang="ts">
    import MyDialog from '@/components/dialogs/MyDialog.vue';
    import {ref} from 'vue';
    const dialog = ref(false)
</script>
