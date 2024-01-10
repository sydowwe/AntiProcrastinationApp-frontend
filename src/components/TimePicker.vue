<template>
    <div>
        <v-row class="my-0" align="center" justify="center">
            <v-col cols="4">
                <VTextField label="Hours" v-model="time.hours" type="number" min="0" max="24" :clearable="false" hide-details></VTextField>
            </v-col>
            <v-col cols="4">
                <VTextField label="Minutes" v-model="time.minutes" type="number" min="0" max="59" :clearable="false" hide-details></VTextField>
            </v-col>
            <v-col cols="4">
                <VTextField label="Seconds" v-model="time.seconds" type="number" min="0" max="59" :clearable="false" hide-details></VTextField>
            </v-col>
        </v-row>
    </div>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    import { TimeObject } from '../classes/TimeUtils';
    export default defineComponent({
        data() {
            return {
                time: new TimeObject(),
            };
        },
        watch: {

            time: {
                handler(newTime:TimeObject) {
                    this.$emit('timeChange', newTime);
                },
                deep: true,
            },
        },
        methods:{
            get(){
                return this.time;
            }
        },
        emits: ['timeChange'],
    });
</script>
