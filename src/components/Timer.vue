<template>
  <div id="content" class="container">
    <div id="column" class="col-xl-6 col-lg-8 col-12">
      <div class="row">
        <div class="col-4 timeTile">
          <input
            type="number"
            min="0"
            max="24"
            value="0"
            id="hoursInput"
            class="timeInput"
          />
          <span id="hoursDisplay" class="timeDisplay" hidden>0</span>
          <span class="descSpan">h</span>
        </div>
        <div class="col-4 timeTile">
          <input
            type="number"
            min="0"
            max="60"
            value="0"
            id="minutesInput"
            class="timeInput"
          />
          <span id="minutesDisplay" class="timeDisplay" hidden>0</span>
          <span class="descSpan">m</span>
        </div>
        <div class="col-4 timeTile">
          <input
            type="number"
            min="0"
            max="60"
            value="0"
            id="secondsInput"
            class="timeInput"
          />
          <span id="secondsDisplay" class="timeDisplay" hidden>0</span>
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
      <save-modal></save-modal>
      <hr />
      <timer-type-select></timer-type-select>
    </div>
  </div>
</template>
<script>
import SaveModal from './modals/SaveModal.vue'
import TimerTypeSelect from './TimerTypeSelect.vue';
import {
  addNewActivityToHistory
} from "./global.js";
import ActivitySelectionForm from "./ActivitySelectionForm.vue";

export default {
  components: {
    ActivitySelectionForm,
    SaveModal,
    TimerTypeSelect
  },
  props: {
    id: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      timeRemaining: 0,
      initialTime: 0,
      paused: false,
      intervalId: null,
    };
  },
  created() {
    this.intervalId = null;
    $("#startBtn").on("click", () => {
      let seconds = parseInt($("#secondsInput").val());
      let minutes = parseInt($("#minutesInput").val());
      let hours = parseInt($("#hoursInput").val());
      if (this.isPaused) {
        this.start();
      } else if (hours > 0 || minutes > 0 || seconds > 0) {
        $("#secondsDisplay").text(seconds);
        $("#minutesDisplay").text(minutes);
        $("#hoursDisplay").text(hours);
        this.setTime(seconds, minutes, hours);
        document.querySelectorAll(".timeInput").forEach((elem) => {
          elem.hidden = true;
        });
        document.querySelectorAll(".timeDisplay").forEach((elem) => {
          elem.hidden = false;
        });
        this.start();
      } else {
        alert("Zadaj nejaký čas!!");
      }
    });

    $("#pauseBtn").on("click", () => {
      this.pause();
    });

    $("#stopBtn").on("click", () => {
      this.stop();
    });

    addEventListener("timerTick", (e) => {
      $("#secondsDisplay").text(e.detail.seconds);
      $("#minutesDisplay").text(e.detail.minutes);
      $("#hoursDisplay").text(e.detail.hours);
    });
    // addEventListener("timerEnded", (e) => {
    //   saveModalObj.setBodyText = `Dĺžka: ${e.detail.length}`;
    //   saveModal.show();
    //   saveModalObj.setSuccessBtnClickFunction = () => {
    //     saveModal.hide();
    //     addNewActivityToHistory(
    //       $(activitySelectionForm.getTemplate).find("#activitySelect").val(),
    //       e.detail.length * 1000
    //     );
    //   };
    // });
    

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
      $("#activityText").prop("disabled", true);
      $("#startBtn").prop("disabled", true);
      $("#stopBtn").prop("disabled", false);
      $("#pauseBtn").prop("disabled", false);
      this.paused = false;
      this.intervalId = setInterval(() => {
        this.timeRemaining -= 1;
        if (this.timeRemaining <= 0) {
          const timerEndedEvent = new CustomEvent("timerEnded", {
            detail: { length: this.initialTime },
          });
          dispatchEvent(timerEndedEvent);
          this.timerEnded();
        } else {
          let hoursTick = Math.floor(this.timeRemaining / 3600);
          let minutesTick =
            hoursTick > 0
              ? Math.floor((this.timeRemaining % 3600) / 60)
              : Math.floor(this.timeRemaining / 60);
          let secondsTick = Math.floor(this.timeRemaining % 60);
          const tickEvent = new CustomEvent("timerTick", {
            detail: {
              hours: hoursTick,
              minutes: minutesTick,
              seconds: secondsTick,
            },
          });
          dispatchEvent(tickEvent);
        }
      }, 1000);
    },
    pause() {
      clearInterval(this.intervalId);
      this.paused = true;
      $("#startBtn").prop("disabled", false);
      $("#pauseBtn").prop("disabled", true);
    },
    timerEnded() {
      this.paused = false;
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.timeRemaining = 0;
      $(".timeInput").val(0);
      document.querySelectorAll(".timeInput").forEach((elem) => {
        elem.hidden = false;
      });
      document.querySelectorAll(".timeDisplay").forEach((elem) => {
        elem.hidden = true;
      });
      $("#activityText").prop("disabled", false);
      $("#pauseBtn").prop("disabled", true);
      $("#stopBtn").prop("disabled", true);
      $("#startBtn").prop("disabled", false);
    },
    stop() {
      const timerEndedEvent = new CustomEvent("timerEnded", {
        detail: { length: this.initialTime - this.timeRemaining },
      });
      dispatchEvent(timerEndedEvent);
      this.#timerEnded();
    },
    setTime(seconds, minutes, hours) {
      this.timeRemaining = 3600 * hours + 60 * minutes + seconds;
      this.initialTime = this.timeRemaining;
    },
  },
};
</script>
