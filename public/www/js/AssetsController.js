
angular.module('starter.controllers').controller('AssetsController', function($scope, ownApi) {

  //page function
  $scope.init = function(data){
    jsData.AssetsController = $scope;
    $scope.pagebackseq = [];

    var predefined = {
      form: 'form_addAsset',
      asset: {},
      _form: {},
    }
    data = $.extend(predefined, data);
    $scope.showForm(data.form);
    $scope._form = data._form;
  }

  //page util
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
    //$scope._form = data;
    $scope.pagebackseq.unshift(form);
  }

  $scope.openMap = function($event, map){
  }

  $scope.viewAsset = function(asset){
    //
    $scope.showForm('form_viewAsset');
    $scope._form = asset;
    $scope.getBookingList(asset);
    //
    //jsData.profile.marker = asset;
    //jsData.updateMarker();
  }

  $scope.editAsset = function(asset){
    //
    $scope.showForm('form_editAsset');
    $scope._form = asset;
    //
    //jsData.profile.marker = asset.markers[0];
    //jsData.updateMarker();
  }

  $scope.addAssetSubmit = function($event, _asset){
    if(_asset.new_name){
      $event.target.disabled = true;
      ownApi.asset.add({
        type: _asset.new_type,
        name: _asset.new_name
      }).done(function(data){
        _asset = {};
        jsData.getAssetList();
        $event.target.disabled = false;

        socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'added asset: '+_asset.new_name});
      }).fail(function(data) {
        console.log(data);  
        $event.target.disabled = false;
      });
    }
  }

  $scope.editAssetSubmit = function($event, asset){
    $event.target.disabled = true;
    ownApi.asset.edit({
      asset_id: asset.asset_id,
      name: asset.name,
      type: asset.type,
    }).done(function(data){
      //console.log(data);
      //_asset = {};
      //jsData.getAssetList();
      $scope.pageback();
      $event.target.disabled = false;

      socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'edited asset: '+asset.name});
    }).fail(function(data) {
      console.log(data);  
      $event.target.disabled = false;
    });
  }

  $scope.deleteAssetSubmit = function($event, asset){
    $event.target.disabled = true;
    ownApi.asset.delete({
      asset_id: asset.asset_id,
    }).done(function(data){
      //console.log(data);
      //_asset = {};
      //jsData.getAssetList();
      $scope.pageback();
      $event.target.disabled = false;

      socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'deleted asset: '+asset.name});
    }).fail(function(data) {
      console.log(data);  
      $event.target.disabled = false;
    });
  }
/*
  $scope.dateRangePickerOnload = function(_asset){
    $('input[name="booking_daterange"]').daterangepicker({
      timePicker: true,
      timePickerIncrement: 5,
      timePicker24Hour: true,
      locale: {
        format: 'YYYY-MM-DD hh:mm A'
      }
    });
    if(_asset == null || _asset == undefined){
      $('input[name="booking_daterange"]').data('daterangepicker').setStartDate(moment(Date()).format('YYYY-MM-DD 08:00:00'));
      $('input[name="booking_daterange"]').data('daterangepicker').setEndDate(moment(Date()).format('YYYY-MM-DD 08:00:00'));
    }else{
      $('input[name="booking_daterange"]').data('daterangepicker').setStartDate(moment(_asset._booking.start).format('YYYY-MM-DD 08:00:00'));
      $('input[name="booking_daterange"]').data('daterangepicker').setEndDate(moment(_asset._booking.end).format('YYYY-MM-DD 08:00:00'));
      _asset._booking.daterange = $('input[name="booking_daterange"]').val();
    }
  }
  */

  $scope.listConflictedBooking = function(_asset){
    console.log('listConflictedBooking', _asset._booking);
    if(_asset._booking.start){
      if(!_asset._booking.end) {
        _asset._booking.end = _asset._booking.start;
      }
      ownApi.asset.booking.list({
        asset_id: _asset.asset_id,
        start: moment(_asset._booking.start).format("YYYY-MM-DDTHH:mm:ssZ"),
        end: moment(_asset._booking.end).format("YYYY-MM-DDTHH:mm:ssZ"),
      }).done(function(data){
        //remove own booking
        data.forEach(function(booking, i){
          if(booking.booking_id == _asset._booking.booking_id){
            data.splice(i,1);;
          }
        });
        console.log('listConflictedBooking', data);
        _asset._booking.conflicted = data;
        $scope.$apply();
      });
    }
  }

  $scope.viewBooking = function(booking){
    $scope.showForm('form_viewBooking');
    $scope._form._booking = booking;
    //$scope.pagebackseq.unshift('form_viewBooking');
  }

  $scope.addBooking = function(_asset){
    $scope.showForm('form_editBooking');
    $scope._form._booking = {asset_id: _asset.asset_id, userlist:[jsData.profile.email]};
  }

  $scope.editBooking = function(_booking){
    $scope.showForm('form_editBooking');
    $scope._form._booking = _booking;
    //$scope.pagebackseq.unshift('form_editBooking');
  }

  $scope.editBookingSubmit = function($event, _asset){
    $event.target.disabled = true;
    var _booking = _asset._booking;
    if(_asset._booking.start){
      if(!_asset._booking.end) {
        _asset._booking.end = _asset._booking.start;
      }
      if(_booking.booking_id){
        ownApi.asset.booking.edit({
          booking_id: _booking.booking_id,
          asset_id: _booking.asset_id,
          summary: _booking.summary,
          start: moment(_booking.start).format("YYYY-MM-DDTHH:mm:ssZ"),
          end: moment(_booking.end).format("YYYY-MM-DDTHH:mm:ssZ"),
          userlist: JSON.stringify(_booking.userlist),
          reminder: _booking.reminder,
          remarks: _booking.remarks,
        }).done(function(data){
          //$scope.getBookingList(_asset);
          //_form = {};
          $scope.pageback();
          $event.target.disabled = false;

          socket_emit('message', {to: _booking.userlist, type: 'booking', message:'updated booking '+_asset._booking.summary+' for '+_asset.name});
        }).fail(function(data) {
          console.log(data);  
          $event.target.disabled = false;
        });
      }else{
        ownApi.asset.booking.add({
          asset_id: _booking.asset_id,
          summary: _booking.summary,
          start: moment(_booking.start).format("YYYY-MM-DDTHH:mm:ssZ"),
          end: moment(_booking.end).format("YYYY-MM-DDTHH:mm:ssZ"),
          userlist: JSON.stringify(_booking.userlist),
          reminder: _booking.reminder,
          remarks: _booking.remarks,
        }).done(function(data){
          $scope.getBookingList(_asset);
          //_booking = {};
          $scope.pageback();
          $event.target.disabled = false;

          socket_emit('message', {to: _booking.userlist, type: 'booking', message:'added booking '+_asset._booking.summary+' for '+_asset.name});
        }).fail(function(data) {
          console.log(data);  
          $event.target.disabled = false;
        });
      }
    }
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
    if ($scope._form._booking.end) {
      var activeDate = moment($scope._form._booking.end);

      $dates.filter(function (date) {
        return date.localDateValue() >= activeDate.valueOf()
      }).forEach(function (date) {
        date.selectable = false;
      })
    }
  }

  function endDateBeforeRender ($view, $dates) {
    if ($scope._form._booking.start) {
      var activeDate = moment($scope._form._booking.start).subtract(1, $view).add(1, 'minute');

      $dates.filter(function (date) {
        return date.localDateValue() <= activeDate.valueOf()
      }).forEach(function (date) {
        date.selectable = false;
      })
    }
  }

});
