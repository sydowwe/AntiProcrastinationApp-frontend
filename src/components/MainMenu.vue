<template>
    <div id="content" class="container">
    <div id="column" class="col-lg-4 col-md-6 col-10">
      <h1 id="name">WatDoing</h1>
      <a class="btn text-light" id="meditateBtn" href="views/meditate.html">Meditate</a>
      <a class="btn text-light" id="toDoListBtn" href="views/newRecord/stopwatch">To-Do list</a>
      <a class="btn text-light" id="whatDidToday" href="/viewHistory">What I did today</a>
      <a class="btn text-light" id="newRecordBtn" href="views/newRecord/timer">New Record</a>
    </div>
  </div>

  <div class="modal fade bd-example-modal-lg" id="myModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg">      
      <div class="modal-content"> 
        <div class="modal-header">
          <button id="printInstructionsBtn" class="btn btn-secondary">Btn</button>
        </div>
        <div class="modal-body"> 
        </div>    
      </div>
    </div>
  </div>
</template>