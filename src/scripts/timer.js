/* jshint esversion: 6 */
import { ReallyCloseModal, SaveModalTemplate, YesNoModalTemplate, _MyModalTemplate, ActivitySelectionForm,addNewActivityToHistory} from "./global.js";

class Timer {
  #timeRemaining = 0;
  #initialTime = 0;
  #paused = false;
  #intervalId;
  constructor() {
    this.#intervalId = null;
  } 

  start() {          
    $("#activityText").prop('disabled', true);
    $("#startBtn").prop('disabled', true);
    $("#stopBtn").prop('disabled', false);
    $("#pauseBtn").prop('disabled', false);
    this.#paused=false;    
    this.#intervalId = setInterval(() => {     
      this.#timeRemaining -= 1; 
      if (this.#timeRemaining<=0) {
        const timerEndedEvent = new CustomEvent('timerEnded', {detail: { length: this.#initialTime}});
        dispatchEvent(timerEndedEvent);   
        this.#timerEnded();
      }
      else{
        let hoursTick = Math.floor(this.#timeRemaining/3600);
        let minutesTick = hoursTick>0 ? Math.floor((this.#timeRemaining % 3600) / 60) : Math.floor(this.#timeRemaining / 60);
        let secondsTick = Math.floor(this.#timeRemaining % 60);
        const tickEvent = new CustomEvent('timerTick', { detail: { hours: hoursTick, minutes: minutesTick, seconds: secondsTick }});
        dispatchEvent(tickEvent);
      }     
    }, 1000);
  }
  pause() {
    clearInterval(this.#intervalId);
    this.#paused=true;
    $("#startBtn").prop('disabled', false);
    $("#pauseBtn").prop('disabled', true);
  }
  #timerEnded() {
    this.#paused=false;
    clearInterval(this.#intervalId);
    this.#intervalId = null;    
    this.#timeRemaining = 0;    
    $('.timeInput').val(0);     
    document.querySelectorAll('.timeInput').forEach(elem=>{
      elem.hidden=false;
    });
    document.querySelectorAll('.timeDisplay').forEach(elem=>{
      elem.hidden=true;
    });        
    $("#activityText").prop('disabled', false); 
    $("#pauseBtn").prop('disabled', true);
    $("#stopBtn").prop('disabled', true);
    $("#startBtn").prop('disabled', false);
  } 
  stop(){
    const timerEndedEvent = new CustomEvent('timerEnded', {detail: { length: this.#initialTime - this.#timeRemaining }});
    dispatchEvent(timerEndedEvent);
    this.#timerEnded();    
  }
  setTime(seconds,minutes,hours){
    this.#timeRemaining = 3600 * hours + 60 * minutes + seconds;
    this.#initialTime = this.#timeRemaining;
  }  
  get isPaused(){
    return this.#paused;
  }
}

$().ready(()=>{
  const timer = new Timer(); 

  const reallyCloseModalObj = new ReallyCloseModal();
  const reallyCloseModalElem = reallyCloseModalObj.getTemplate;
  const reallyCloseModal = reallyCloseModalObj.getModal;
  document.getElementById('modals').appendChild(reallyCloseModalElem);

  const saveModalObj = new SaveModalTemplate(reallyCloseModal);
  const saveModalElem = saveModalObj.getTemplate;
  const saveModal = saveModalObj.getModal;
  document.getElementById('modals').appendChild(saveModalElem);
  reallyCloseModalObj.setReturnToModal = saveModal;

  const activitySelectionForm = new ActivitySelectionForm();
  document.getElementById('activityDiv').appendChild(activitySelectionForm.getTemplate);

  $('#startBtn').click(()=>{    
    let seconds = parseInt($('#secondsInput').val());    
    let minutes = parseInt($('#minutesInput').val());
    let hours = parseInt($('#hoursInput').val());
    if(timer.isPaused){
      timer.start();      
    }    
    else if(hours>0 || minutes>0 || seconds>0){
      $('#secondsDisplay').text(seconds);
      $('#minutesDisplay').text(minutes);
      $('#hoursDisplay').text(hours); 
      timer.setTime(seconds,minutes,hours);    
      document.querySelectorAll('.timeInput').forEach(elem=>{
        elem.hidden=true;
      });
      document.querySelectorAll('.timeDisplay').forEach(elem=>{
        elem.hidden=false;
      });      
      timer.start();      
    }
    else{
      alert('Zadaj nejaký čas!!');
    }
  });

  $('#pauseBtn').click(()=>{
    timer.pause(); 
  });
  
  $('#stopBtn').click(()=>{
    timer.stop();    
  });      
  
  addEventListener('timerTick', e => {
    $('#secondsDisplay').text(e.detail.seconds);
    $('#minutesDisplay').text(e.detail.minutes);
    $('#hoursDisplay').text(e.detail.hours);
  });
  addEventListener('timerEnded', e => {
    saveModalObj.setBodyText = `Dĺžka: ${e.detail.length}`;
    saveModal.show();
    saveModalObj.setSuccessBtnClickFunction = () => {
      saveModal.hide();
      addNewActivityToHistory($(activitySelectionForm.getTemplate).find('#activitySelect').val(),e.detail.length * 1000);
    }
  });
})

