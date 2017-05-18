
angular.module('starter.controllers').controller('TasksController', function($scope, $ionicPopup) {


  $scope.init = function(){
    //view data
    //scope.SortByList = true;
    //$scope.title = "Tasks";
    $scope.pagebackseq = [];
    $scope.showForm("tasklist");

    //form submit data
    $scope._tasklist = {};
    $scope._task = {};
    $scope._event = {};
    /*
    $('input[name="task_due"]').daterangepicker({
      singleDatePicker: true,
      showDropdowns: true,
      locale: {
        format: 'YYYY-MM-DD',
      }
    });
    $('input[name="event_daterange"]').daterangepicker({
      timePicker: true,
      timePickerIncrement: 5,
      timePicker24Hour: true,
      locale: {
        format: 'YYYY-MM-DD hh:mm A'
      }
    });
    */
  }

    //$scope.init();
  //$scope.pagebackseq = [];
  $scope.pageback = function(){
    if($scope.pagebackseq.length == 1){
      jsData.closeModal();
    }else{
      $scope.pagebackseq.splice(0, 1);
      $scope.showingForm = $scope.pagebackseq[0];
    }
  }

  $scope.showForm = function(form){
    $scope.showingForm = form;
    $scope.pagebackseq.unshift(form);
  }

  $scope.setDateRangePicker = function(element){
    console.log(element);
    element.daterangepicker({
      timePicker: true,
      timePickerIncrement: 5,
      timePicker24Hour: true,
      locale: {
        format: 'YYYY-MM-DD hh:mm A'
      }
    });
  }

  $scope.addTasklist = function(){
    console.log("addTasklist");
    listTasklists();
    $scope._tasklist = {};
    $scope.showForm("form_tasklist");
  }

  $scope.editTasklist = function(tasklist){ }

  $scope.deleteTasklist = function(tasklist){
    console.log("deleteTasklist");
    $scope._tasklist = {
      id: tasklist.id,
    }
    $scope.showForm("form_tasklist");
  }

  $scope.addTask = function(tasklist){ }

  $scope.editTask = function(tasklist, task){
    console.log("editTask");
    $scope._task = task;
    if($scope._task.due){
      $scope._task.due = moment($scope._task.due);
    }
    $scope._tasklist = tasklist;

    $scope.showForm("form_task");
  }

  $scope.deleteTask = function(){ }

  $scope.addEvent = function(){
    console.log("editEvent");
    $scope._event = {};
    $scope._event.start = {dateTime: new Date()};
    $scope._event.end = {dateTime: new Date()};
    $('input[name="event_daterange"]').data('daterangepicker').setStartDate($scope._event.start.dateTime);
    $('input[name="event_daterange"]').data('daterangepicker').setEndDate($scope._event.end.dateTime);

    $scope.showForm("form_event");
  }

  $scope.editEvent = function(event){
    console.log("editEvent");
    $('#modal_title').html("Edit Event");
    $scope._event = event;
    $('input[name="event_daterange"]').data('daterangepicker').setStartDate(event.start.dateTime);
    $('input[name="event_daterange"]').data('daterangepicker').setEndDate(event.end.dateTime);

    $scope.showForm("form_event");
  }

  $scope.deleteEvent = function(){ }


  $scope.addTasklistSubmit = function($event){
    if($scope._tasklist.title){
      $event.target.disabled = true;
      gapi_client.tasksApi.tasklists.insert({
        'resource': {
          title: $scope._tasklist.title,
        }
      }).then(function(response) {

        socket_emit('message', {to: [jsData.profile.email], type: 'task', message:'added tasklist: '+$scope._tasklist.title});

        $scope._tasklist.title = '';
        $event.target.disabled = false;
        listTasklists();
      }, function(reason) {
        console.log('Error: ' + reason.result.error.message);
        $event.target.disabled = false;
      });
    }
  }
  $scope.editTasklistSubmit = function($event, tasklist){
    if(tasklist.title){
      $event.target.disabled = true;
      gapi_client.tasksApi.tasklists.update({
        'tasklist': tasklist.id,
        'resource': {
          id: tasklist.id,
          title: tasklist.title,
        }
      }).then(function(response) {
        $event.target.disabled = false;
        listTasklists();

        socket_emit('message', {to: [jsData.profile.email], type: 'task', message:'edited tasklist: '+tasklist.title});
      }, function(reason) {
        console.log('Error: ' + reason.result.error.message);
        $event.target.disabled = false;
      });
    }
  }
  $scope.deleteTasklistSubmit = function($event, tasklist){
    $event.target.disabled = true;
    gapi_client.tasksApi.tasklists.delete({
      'tasklist': tasklist.id,
    }).then(function(response) {
      $event.target.disabled = false;
      listTasklists();

      socket_emit('message', {to: [jsData.profile.email], type: 'task', message:'deleted tasklist: '+tasklist.title});
    }, function(reason) {
      console.log('Error: ' + reason.result.error.message);
      $event.target.disabled = false;
    });
  }

  $scope.addTaskSubmit = function($event, tasklist){
    if($scope._task.new_title){
      $event.target.disabled = true;
      gapi_client.tasksApi.tasks.insert({
        'tasklist': tasklist.id,
        'resource': {
          title: $scope._task.new_title
        }
      }).then(function(response) {

        socket_emit('message', {to: [jsData.profile.email], type: 'task', message:'added task: '+$scope._task.new_title});

        $scope._task.new_title = '';
        $event.target.disabled = false;
        getTasks([tasklist]);
      }, function(reason) {
        console.log('Error: ' + reason.result.error.message);
        $event.target.disabled = false;
      });
    }
  }

  $scope.deleteTaskSubmit = function($event, tasklist, task){
    $event.target.disabled = true;
    gapi_client.tasksApi.tasks.delete({
      'tasklist': tasklist.id,
      'task': task.id,
    }).then(function(response) {
      getTasks([tasklist]);
      $event.target.disabled = false;

      socket_emit('message', {to: [jsData.profile.email], type: 'task', message:'deleted task: '+task.title});
    }, function(reason) {
      console.log('Error: ' + reason.result.error.message);
      $event.target.disabled = false;
    });
  }

  $scope.editTaskSubmit = function($event, tasklist, task){
    if(task.title){
      if(tasklist.old_id == tasklist.new_id){
        $event.target.disabled = true;
        gapi_client.tasksApi.tasks.update({
          'tasklist': tasklist.id,
          'task': task.id,
          'resource': {
            id: task.id,
            title: task.title,
            notes: task.notes,
            due: task.due //$('input[name="task_due"]').data('daterangepicker').startDate.format("YYYY-MM-DDThh:mm:ssZ"),
          }
        }).then(function(response) {
          getTasks([tasklist]);
          $scope.pageback();
          $event.target.disabled = false;

          socket_emit('message', {to: [jsData.profile.email], type: 'task', message:'edited task: '+task.title});
        }, function(reason) {
          console.log('Error: ' + reason.result.error.message);
          $event.target.disabled = false;
        });
      }else{
        $event.target.disabled = true;
        console.log('insert new task', tasklist);
        gapi_client.tasksApi.tasks.insert({
          'tasklist': tasklist.new_id,
          'resource': {
            title: task.title,
            notes: task.notes,
            due: task.due
          }
        }).then(function(response) {
          console.log('delete old task', tasklist);
          $scope.deleteTaskSubmit($event, tasklist, task);
          listTasklists();
        }, function(reason) {
          console.log('Error: ' + reason.result.error.message);
          $event.target.disabled = false;
        });
      }
    }
  }

  $scope.editEventSubmit = function($event, event){
    if(event.summary){
      $event.target.disabled = true;

      var request;
      var request_body = {
        'calendarId' : "primary",
        'resource': {
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: {dateTime: $('input[name="event_daterange"]').data('daterangepicker').startDate.format("YYYY-MM-DDThh:mm:ssZ")},
          end: {dateTime: $('input[name="event_daterange"]').data('daterangepicker').endDate.format("YYYY-MM-DDThh:mm:ssZ")},
        }
      };

      if(event.id){
        request_body.eventId = event.id;
        request = gapi_client.calendarApi.events.update(request_body);
      }else{
        request = gapi_client.calendarApi.events.insert(request_body);
      }
      request.then(function(response) {
        listUpcomingEvents();
        $scope.pageback();
        $event.target.disabled = false;
      }, function(reason) {
        console.log('Error: ' + reason.result.error.message);
        $event.target.disabled = false;
      });
    }
  }

  $scope.deleteEventSubmit = function($event, event){
    $event.target.disabled = true;
    gapi_client.calendarApi.events.delete({
      eventId: event.id,
      calendarId : "primary",
    }).then(function(response) {
      listUpcomingEvents();
      $scope.pageback();
      $event.target.disabled = false;
    }, function(reason) {
      console.log('Error: ' + reason.result.error.message);
      $event.target.disabled = false;
    });
  }
});