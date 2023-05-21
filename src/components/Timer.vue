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

      <div id="activityDiv"></div>
      <hr />
      <select name="timerType" id="timerType" class="form-select-lg mb-3">
        <option value="timer" selected>Timer</option>
        <option value="stopwatch">Stopwatch</option>
        <option value="alarm">Alarm</option>
      </select>
    </div>
  </div>
</template>
