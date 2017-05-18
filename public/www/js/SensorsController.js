angular.module('starter.controllers').controller('SensorsController', function($scope, ownApi) {

  $scope.init = function(data){
    jsData.SensorsController = $scope;
    $scope.pagebackseq = [];

    var predefined = {
      form: 'form_addSensor',
      sensor: {},
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
    $scope.pagebackseq.unshift(form);
  }

  $scope.openMap = function($event, map){
  }

  $scope.searchSensor = function($event){
    $event.target.disabled = true;
    jsData.BleCentralController.search(function(){
      $event.target.disabled = false;
    });

    jsData.UpnpController.search();
  }

  $scope.editSensor = function(sensor){
    $scope.showForm('form_editSensor');
    $scope._form = sensor;
    //$scope.profile.marker = sensor.markers[0];
    //$scope.updateMarker(sensor.markers[0]);
    //$scope.pagebackseq.unshift('form_addSensor');
  }

  $scope.addSensorSubmit = function($event, device){
    if(device.description){
      $event.target.disabled = true;
      ownApi.sensor.add({
        address: device.address,
        name: device.name,
        description: device.description,
        rssi: device.rssi,
        status: device.status,
        //data: device.data,
      }).done(function(data){
        device.sensor_id = data.sensor_id;
        jsData.getSensorList();
        $event.target.disabled = false;

        socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'added Sensor: '+device.description});
      }).fail(function(data) {
        console.log(data);  
        $event.target.disabled = false;
      });
    }
  }

  $scope.editSensorSubmit = function($event, sensor){
    console.log(sensor);
    $event.target.disabled = true;
    ownApi.sensor.edit({
      sensor_id: sensor.sensor_id,
      address: sensor.address,
      name: sensor.name,
      description: sensor.description,
      rssi: sensor.rssi,
      status: sensor.status,
      //data: sensor.data,
    }).done(function(data){
      //console.log(data);
      $scope.pageback();
      $event.target.disabled = false;

      socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'edited Sensor: '+sensor.description});
    });
  }

  $scope.deleteSensorSubmit = function($event, sensor){
    $event.target.disabled = true;
    ownApi.sensor.delete({
      sensor_id: sensor.sensor_id,
      address: sensor.address,
    }).done(function(data){
      //console.log(data);
      sensor.sensor_id = null;
      $scope.pageback();
      $event.target.disabled = false;

      socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'deleted Sensor: '+sensor.description});
    });
  }
});