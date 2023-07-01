<template>
    <div>
        <label for="timerType">Select type of length measurement</label>
        <select name="timerType" id="timerType" class="form-select-lg mb-3" v-model="selectedTimerType" @change="redirect">
            <option value="timer">Timer</option>
            <option value="stopwatch">Stopwatch</option>
            <option value="alarm">Alarm</option>
        </select>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                selectedTimerType: 'timer',
            };
        },
        methods: {
            redirect() {
                this.$router.push('/' + this.selectedTimerType);
            },
        },
    };
</script>
