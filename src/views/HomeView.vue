<template>
<div>
	<MyDialog v-model="dialog" title="Dialog" ></MyDialog>
	<VBtn @click="dialog = !dialog" size="large">Click me</VBtn>

	<NullFalseTrueCheckbox v-model="value" ></NullFalseTrueCheckbox>
</div>
</template>
<script setup lang="ts">
    import MyDialog from '@/components/dialogs/MyDialog.vue';
    import {ref, watch} from 'vue';
    import NullFalseTrueCheckbox from '@/components/NullFalseTrueCheckbox.vue';


    const dialog = ref(false)
    let value = ref(null);

    watch(value, (newValue) => {
	    console.log('New value: ', newValue);
    });
</script>
