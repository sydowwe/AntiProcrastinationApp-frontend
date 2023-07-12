<template>
  <v-container class="p-4">
    <v-row justify="center">
      <v-col cols="12" lg="6" xl="4">
        
        <v-btn @click="start" color="primary" dark>Start</v-btn>
        <v-btn @click="pause" color="primary" dark :disabled="intervalId !== null && !paused">Pause</v-btn>
        <v-btn @click="stop" color="primary" dark :disabled="intervalId === null">Stop</v-btn>
        <div id="activityDiv">
          <activity-selection-form></activity-selection-form>
        </div>
        <save-modal></save-modal>
        <hr />
        <timer-type-select></timer-type-select>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import TimerTypeSelect from './TimerTypeSelect.vue';
import ActivitySelectionForm from './ActivitySelectionForm.vue';
import { addNewActivityToHistory } from './global.js';

export default {
  components: {
    ActivitySelectionForm,
    SaveModal,
    TimerTypeSelect,
  },
  data() {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      timeRemaining: 0,
      initialTime: 0,
      paused: false,
      intervalId: null,
      timeInputVisible: true,
    };
  },
  created() {
    this.intervalId = null;
  },
  methods: {
    start() {
      const seconds = parseInt(this.seconds);
      const minutes = parseInt(this.minutes);
      const hours = parseInt(this.hours);
      if (this.isPaused) {
        this.resume();
      } else if (hours > 0 || minutes > 0 || seconds > 0) {
        this.updateTimeDisplay();
        this.setTime(seconds, minutes, hours);
        this.timeInputVisible = false;
        this.startTimer();
      } else {
        alert('Zadaj nejaký čas!!');
      }
    },
    pause() {
      clearInterval(this.intervalId);
      this.paused = true;
    },
    resume() {
      this.paused = false;
      this.startTimer();
    },
    stop() {
      this.pause();
      this.timerEnded();
    },
    startTimer() {
      this.intervalId = setInterval(() => {
        this.timeRemaining -= 1;
        if (this.timeRemaining <= 0) {
          this.timerEnded();
        } else {
          this.updateTimeDisplay();
        }
      }, 1000);
    },
    updateTimeDisplay() {
      const hours = Math.floor(this.timeRemaining / 3600);
      const minutes = Math.floor((this.timeRemaining % 3600) / 60);
      const seconds = Math.floor(this.timeRemaining % 60);
      this.hours = hours;
      this.minutes = minutes;
      this.seconds = seconds;
    },
    timerEnded() {
      const lengthInSeconds = this.initialTime - this.timeRemaining;
      const lengthInMilliseconds = lengthInSeconds * 1000;

      this.paused = false;
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.timeRemaining = 0;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.timeInputVisible = true;

      this.$refs.saveModal.setBodyText = `Dĺžka: ${lengthInSeconds}`;
      this.$refs.saveModal.show();
      this.$refs.saveModal.setSuccessBtnClickFunction = () => {
        this.$refs.saveModal.hide();
        addNewActivityToHistory(this.$refs.activitySelectionForm.activityId, lengthInMilliseconds);
      };
    },
    setTime(seconds, minutes, hours) {
      this.timeRemaining = 3600 * hours + 60 * minutes + seconds;
      this.initialTime = this.timeRemaining;
    },
  },
};
</script>