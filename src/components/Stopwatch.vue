<template>
  <div id="content" class="container">
    <div id="column" class="col-xl-6 col-lg-8 col-12">
      <div class="row">
        <div class="col-4 timeTile">
          <span id="hoursDisplay" class="timeDisplay">0</span>
          <span class="descSpan">h</span>
        </div>
        <div class="col-4 timeTile">
          <span id="minutesDisplay" class="timeDisplay">0</span>
          <span class="descSpan">m</span>
        </div>
        <div class="col-4 timeTile">
          <span id="secondsDisplay" class="timeDisplay">0</span>
          <span class="descSpan">s</span>
        </div>
      </div>
      <button class="btn btn-primary text-light" id="startBtn">Start</button>
      <button class="btn btn-primary text-light" id="pauseBtn" disabled>
        Pause
      </button>
      <button class="btn btn-primary text-light" id="stopBtn" disabled>
        Stop
      </button>
      <div id="activityDiv">
        <activity-selection-form></activity-selection-form>
      </div>
      <hr />
      <label for="timerType">Select type of length measurement</label>
      <select name="timerType" id="timerType" class="form-select-lg mb-3">
        <option value="timer">Timer</option>
        <option value="stopwatch" selected>Stopwatch</option>
        <option value="alarm">Alarm</option>
      </select>
    </div>
  </div>
</template>

<script>
import { ReallyCloseModal, SaveModal, YesNoModal, ActivitySelectionForm } from './modals/YesNoModal.vue'
import ActivitySelectionForm, {ActivitySelectionForm} from './ActivitySelectionForm.vue'
export default {
  components: {
    ActivitySelectionForm,
  },
  props: {
    id: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      hours: 0,
      seconds: 0,
      minutes: 0,
      paused: false,
      intervalId: null,
    };
  },
  created() {
    this.data.intervalId = null;

    // const reallyCloseModalObj = new ReallyCloseModal();
    // var reallyCloseModalElem = reallyCloseModalObj.getTemplate;
    // var reallyCloseModal = reallyCloseModalObj.getModal;
    // document.getElementById("modals").appendChild(reallyCloseModalElem);

    // const saveModalObj = new SaveModalTemplate(reallyCloseModal);
    // var saveModalElem = saveModalObj.getTemplate;
    // var saveModal = saveModalObj.getModal;
    // document.getElementById("modals").appendChild(saveModalElem);
    // reallyCloseModalObj.setReturnToModal = saveModal;

    $("#startBtn").on("click", () => {
      stopwatch.start();
      $("#activityText").prop("disabled", true);
    });

    $("#pauseBtn").on("click", () => {
      stopwatch.pause();
    });

    $("#stopBtn").on("click", () => {
      stopwatch.stop();
      $("#activityText").prop("disabled", false);
    });

    addEventListener("stopwatchTick", (e) => {
      $("#secondsDisplay").text(e.detail.seconds);
      $("#minutesDisplay").text(e.detail.minutes);
      $("#hoursDisplay").text(e.detail.hours);
    });
    addEventListener("stopwatchStopped", (e) => {
      saveModalObj.setBodyText = `Hodiny: ${e.detail.hoursPassed} minúty: ${e.detail.minutesPassed} seconds: ${e.detail.secondsPassed}`;
      saveModal.show();
    });

    // let url = ``;
    // $.ajax({
    //   type: "GET",
    //   contentType: "application/json",
    //   url: url,
    // }).done((data) => {
    // });
  },
  methods: {
    start() {
      $("#startBtn").prop("disabled", true);
      $("#stopBtn").prop("disabled", false);
      $("#pauseBtn").prop("disabled", false);
      this.paused = false;
      this.intervalId = setInterval(() => {
        if (this.seconds < 59) {
          this.seconds++;
        } else if (this.minutes < 59) {
          this.seconds = 0;
          this.minutes++;
        } else {
          this.seconds = 0;
          this.minutes = 0;
          this.hours++;
        }
        const tickEvent = new CustomEvent("stopwatchTick", {
          detail: {
            hours: this.hours,
            minutes: this.minutes,
            seconds: this.seconds,
          },
        });
        dispatchEvent(tickEvent);
      }, 1000);
    },
    pause() {
      clearInterval(this.intervalId);
      this.paused = true;
      $("#startBtn").prop("disabled", false);
      $("#pauseBtn").prop("disabled", true);
    },
    stop() {
      const stopwatchStoppedEvent = new CustomEvent("stopwatchStopped", {
        detail: {
          hoursPassed: this.hours,
          minutesPassed: this.minutes,
          secondsPassed: this.seconds,
        },
      });
      dispatchEvent(stopwatchStoppedEvent);
      clearInterval(this.intervalId);
      this.hours = this.minutes = this.seconds = 0;
      this.intervalId = null;
      this.paused = false;
      $(".timeDisplay").text(0);
      $("#pauseBtn").prop("disabled", true);
      $("#stopBtn").prop("disabled", true);
      $("#startBtn").prop("disabled", false);
    },
  },
};
</script>
