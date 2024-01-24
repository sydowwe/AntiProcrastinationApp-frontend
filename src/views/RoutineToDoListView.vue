<template>

</template>
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
onMounted(()=>{
    axios.post(`/routine-to-do-list/get-all`)
    .then(response=>{
        console.log(response);
        
    })
    .catch(error=>{
        console.log(error);
        
    })
});
</script>