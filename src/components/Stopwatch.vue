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
      <button class="btn btn-primary text-light" id="pauseBtn" disabled>Pause</button>
      <button class="btn btn-primary text-light" id="stopBtn" disabled>Stop</button>
      <div id="activityDiv">       
      </div>
      <hr>
      <label for="timerType">Select type of length measurement</label>
      <select name="timerType" id="timerType" class="form-select-lg mb-3">
        <option value="timer">Timer</option>
        <option value="stopwatch" selected>Stopwatch</option>
        <option value="alarm">Alarm</option>
      </select>         
    </div>
  </div>
</template>