<template>
    <div>
        <CreateNewActivityForm></CreateNewActivityForm>
    </div>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import CreateNewActivityForm from '../components/CreateNewActivityForm.vue';
    export default defineComponent({
        components: {
            CreateNewActivityForm,
        },
    });
</script>
<style></style>
