<template>
    <VDialog v-model="loading" persistent fullscreen>
        <VCard color="transparent" flat class="d-flex justify-center align-center">
            <VProgressCircular indeterminate color="purple" :size="80" :width="13"></VProgressCircular>
        </VCard>
    </VDialog>
</template>

<script lang="ts">
 import { defineComponent, ref } from 'vue';
    export default defineComponent( {
        props:{
            show:{
                type: Boolean,
                required: true,
                default: false,
            }
        },
        computed:{
            loading(){
                return this.show;
            }
        }
    });
</script>