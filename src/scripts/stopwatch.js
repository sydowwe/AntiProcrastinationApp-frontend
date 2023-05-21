import { ReallyCloseModal, SaveModalTemplate, YesNoModalTemplate, ActivitySelectionForm } from "./global.js";

class Stopwatch {
  #hours = 0;
  #seconds = 0;
  #minutes = 0;
  #paused = false;
  #intervalId;
  constructor() {
    this.#intervalId = null;       
  } 
  
  start() {          
    $("#startBtn").prop('disabled', true);
    $("#stopBtn").prop('disabled', false);
    $("#pauseBtn").prop('disabled', false);
    this.#paused=false;    
    this.#intervalId = setInterval(() => { 
        if(this.#seconds<59){
            this.#seconds++;
        }    
        else if(this.#minutes<59){
            this.#seconds = 0;
            this.#minutes++;
        }
        else{
            this.#seconds = 0;
            this.#minutes = 0;
            this.#hours++;
        }        
        const tickEvent = new CustomEvent('stopwatchTick', { detail: { hours: this.#hours, minutes: this.#minutes, seconds: this.#seconds }});
        dispatchEvent(tickEvent);
    }, 1000);
  }
  pause() {
    clearInterval(this.#intervalId);
    this.#paused=true;
    $("#startBtn").prop('disabled', false);
    $("#pauseBtn").prop('disabled', true);
  } 
  stop(){   
    const stopwatchStoppedEvent = new CustomEvent('stopwatchStopped', {detail: { hoursPassed: this.#hours,
       minutesPassed: this.#minutes, secondsPassed: this.#seconds }});
    dispatchEvent(stopwatchStoppedEvent);
    clearInterval(this.#intervalId);
    this.#hours = this.#minutes = this.#seconds = 0;
    this.#intervalId = null;    
    this.#paused=false;
    $('.timeDisplay').text(0);
    $("#pauseBtn").prop('disabled', true);
    $("#stopBtn").prop('disabled', true);
    $("#startBtn").prop('disabled', false);   
  } 
  get isPaused(){
    return this.#paused;
  }
}

$().ready(()=>{
  const stopwatch = new Stopwatch(); 

  const reallyCloseModalObj = new ReallyCloseModal(); 
  var reallyCloseModalElem = reallyCloseModalObj.getTemplate;
  var reallyCloseModal = reallyCloseModalObj.getModal;
  document.getElementById('modals').appendChild(reallyCloseModalElem);

  const saveModalObj = new SaveModalTemplate(reallyCloseModal); 
  var saveModalElem = saveModalObj.getTemplate;
  var saveModal = saveModalObj.getModal; 
  document.getElementById('modals').appendChild(saveModalElem);
  reallyCloseModalObj.setReturnToModal = saveModal;

  var activitySelectionForm = new ActivitySelectionForm();
  document.getElementById('activityDiv').appendChild(activitySelectionForm.getTemplate);
  
  $('#startBtn').click(()=>{    
    stopwatch.start();    
    $("#activityText").prop('disabled', true); 
  });

  $('#pauseBtn').click(()=>{
    stopwatch.pause(); 
  });
  
  $('#stopBtn').click(()=>{
    stopwatch.stop();   
    $("#activityText").prop('disabled', false);
  });      
  
  addEventListener('stopwatchTick', e => {
    $('#secondsDisplay').text(e.detail.seconds);
    $('#minutesDisplay').text(e.detail.minutes);
    $('#hoursDisplay').text(e.detail.hours);
  });
  addEventListener('stopwatchStopped', e => {
    saveModalObj.setBodyText = `Hodiny: ${e.detail.hoursPassed} minúty: ${e.detail.minutesPassed} seconds: ${e.detail.secondsPassed}`;
    saveModal.show();
  });
})