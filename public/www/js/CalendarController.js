angular.module('starter.controllers').controller('CalendarController', function($scope, ownApi, Upload) {

  $scope.init = function(data){
    jsData.CalendarController = $scope;

    $scope.pagebackseq = [];
    $scope.title = "Calendar";
    $scope.showForm('calendar');
    $scope.events = [];
    $scope._event = {};

    /* config object */
    $scope.uiConfig = {
      calendar:{
        //height: 450,
        editable: true,
        header:{
          left: 'month agendaWeek',
          center: 'title',
          right: 'today prev,next'
        },
        viewRender: function(view, element) {
          //console.log("View Changed: ", view.visStart, view.visEnd, view.start, view.end);
          $scope.viewstart = view.start;
          $scope.viewend = view.end; 
          $scope.listEvents(view.start, view.end);
          $scope.listBookings(view.start, view.end);
        },
        eventClick: function(calEvent, jsEvent, view) {
          console.log('calEvent',calEvent);
          if(!calEvent.booking_id){
            $scope.editEvent(calEvent);
          }else{
            $scope.editBooking(calEvent);
          }
        },
        dayClick: function(date, jsEvent, view) {
          console.log('Clicked on: ' + date.format());
          $scope.addEvent(date);
        }
        //eventDrop: $scope.alertOnDrop,
        //eventResize: $scope.alertOnResize
      }
    };
    setTimeout(function () {
      $('#calendar').fullCalendar( 'render' );
    }, 1000);
  }

  $scope.pageback = function(){
    if($scope.pagebackseq.length == 1){
      listUpcomingEvents();
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

  /* Bindable functions
  -----------------------------------------------*/
  $scope.endDateBeforeRender = endDateBeforeRender
  $scope.endDateOnSetTime = endDateOnSetTime
  $scope.startDateBeforeRender = startDateBeforeRender
  $scope.startDateOnSetTime = startDateOnSetTime

  function startDateOnSetTime () {
    $scope.$broadcast('start-date-changed');
  }

  function endDateOnSetTime () {
    $scope.$broadcast('end-date-changed');
  }

  function startDateBeforeRender ($dates) {
    if ($scope._event.end) {
      var activeDate = moment($scope._event.end);

      $dates.filter(function (date) {
        return date.localDateValue() >= activeDate.valueOf()
      }).forEach(function (date) {
        date.selectable = false;
      })
    }
  }

  function endDateBeforeRender ($view, $dates) {
    if ($scope._event.start) {
      var activeDate = moment($scope._event.start).subtract(1, $view).add(1, 'minute');

      $dates.filter(function (date) {
        return date.localDateValue() <= activeDate.valueOf()
      }).forEach(function (date) {
        date.selectable = false;
      })
    }
  }

  /*
  $scope.setCalendar = function(){
    $('#calendar').fullCalendar({
         weekends: true,
         header: {
             left: 'prev,next today',
             center: 'title',
             right: 'month,agendaWeek,agendaDay'
         },
         editable: true,
         eventLimit: true, // allow "more" link when too many events
         eventClick: function(calEvent, jsEvent, view) {
            console.log('calEvent',calEvent);
            jsData.CalendarController.editEvent(calEvent);
         },
         dayClick: function(date, jsEvent, view) {
            console.log('Clicked on: ' + date.format());
            jsData.CalendarController.addEvent(date);
        }
    });
  }

  $scope.setDateRangePicker = function(){
    $('input[name="event_daterange"]').daterangepicker({
      timePicker: true,
      timePickerIncrement: 5,
      timePicker24Hour: true,
      locale: {
        format: 'YYYY-MM-DD hh:mm A'
      }
    });
  }
  */
  
  $scope.listEvents = function(start, end){
    gapi_client.calendarApi.listUpcomingEvents({
      'timeMin':new Date(start).toISOString(),
      'timeMax':new Date(end).toISOString(),
      'maxResults': 1000
    }, function(events){
      events.forEach(function(event){
        //addition fields for full calendar
        event.title = event.summary;
        event.start = event.start.dateTime ? event.start.dateTime : event.start.date;
        event.end = event.end.dateTime ? event.end.dateTime : event.end.date;
        event.color = "red";
      });
      leftJoin($scope.events, events, 'id');
      console.log("listEvents", events);
      $('#calendar').fullCalendar( 'removeEvents' );
      $('#calendar').fullCalendar( 'addEventSource', {events : $scope.events});
    });
  }
  
  $scope.listBookings = function(start, end){
    ownApi.asset.booking.list({
      start: moment(start).format("YYYY-MM-DDTHH:mm:ssZ"),
      end: moment(end).format("YYYY-MM-DDTHH:mm:ssZ"),
    }).done(function(events){
      events.forEach(function(event){
        //addition fields for full calendar
        event.id = event.booking_id;
        event.title = event.summary;
        event.color = "green";
        //eventObj.color = rgb(255,0,0);
      });
      leftJoin($scope.events, events, 'id');
      console.log("listBookings", events);
      $('#calendar').fullCalendar( 'removeEvents' );
      $('#calendar').fullCalendar( 'addEventSource', {events : $scope.events});
    });
  }

  $scope.addEvent = function(date){
    $scope.title = "Add new event";
    $scope._event = {start:date};
    $scope.showForm('form_editEvent');
  }

  $scope.editEvent = function(event){
    $scope.title = "Edit event";
    $scope._event = event;
    $scope.showForm('form_editEvent');
  }

  $scope.editBooking = function(booking){
    if(!booking.asset_id) return;
    var asset = getDataFromKeyValue(jsData.assetlist, 'asset_id', booking.asset_id);
    if(asset){
      asset._booking = booking;
      jsData.showModal('#assetsManageModal', {form:'form_editBooking', _form: asset});
    }
  }

  $scope.eventSubmit = function($event, event){
    $scope.msg = "";
    if(event.summary != ''){
      var data = {
        'summary': event.summary,
        'location': event.location,
        'description': event.description,
        'start': {
          'dateTime': event.start,
        },
        'end': {
          'dateTime': event.end ? event.end : event.start,
        },
      }
      console.log(event);
      $event.target.disabled = true;
      if(event.id && event.iCalUID){
          //edit event
          gapi_client.calendarApi.events.update({
            'eventId' : event.id,
            'calendarId' : "primary",
            'resource': data
          }).then(function(event) {
            $scope.pageback();
            $event.target.disabled = false;

            socket_emit('message', {to: [jsData.profile.email], type: 'event', message:'edited event: '+event.summary});
          });
        }else{
          //add new event
          gapi_client.calendarApi.events.insert({
            'calendarId': 'primary',
            'resource': data
          }).then(function(event) {
            $scope.pageback();
            $event.target.disabled = false;

            socket_emit('message', {to: [jsData.profile.email], type: 'event', message:'added event: '+event.summary});
          });
        }
      }else{
        $scope.msg = "Please enter event title";
      }
    }

    $scope.eventDeleteSubmit = function($event, event){
      $scope.msg = "";
      if(event.summary == '' || event.summary == null){
        //delete event
        $event.target.disabled = true;
        gapi_client.calendarApi.events.delete({
          'eventId' : event.id,
          'calendarId' : "primary"
        }).then(function(event) {
          $scope.pageback();
          $event.target.disabled = false;

          socket_emit('message', {to: [jsData.profile.email], type: 'event', message:'deleted event: '+event.summary});
        });
      }else{
        $scope.msg = "Clear event title to delete this event";
      }
    }

  });
