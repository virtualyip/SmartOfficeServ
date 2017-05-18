angular.module('starter.controllers', ['ngCordova', 'ngCordovaOauth'])

.controller('AnnyangController', function($scope) {

  $scope.init = function() {
    console.log("Enabling annyang");
    if (annyang) {
      var anything = function(anything) {
        console.log(anything);
        alert(anything);
        if(action.hasOwnProperty(anything)){
          action[anything]();
        }
        annyang.abort();
      };

      var action = {
        'open calendar' : function(){
          jsData.showModal('calendarManageModal',{form:null});
        },
        'open user' : function(){
          jsData.showModal('#usersManageModal',{form:'form_addUser'});
        },
        'open sensor' : function(){
          jsData.showModal('#sensorsManageModal',{form:'form_addSensor'});
        },
        'open task' : function(){
          jsData.showModal('#tasksManageModal',{form:'form_tasklist'});
        },
        'open asset' : function(){
          jsData.showModal('#assetsManageModal',{form:'form_addAsset'});
        },
        'open email' : function(){
          jsData.showModal('#contactsManageModal',{form:'threadlists'});
        },
        'switch on' : function(){
          var sensor = getDataFromKeyValue(jsData.sensorlist, 'name', 'WeMo Switch');
          socket_sensorAction(sensor, 'switchOn');
        },
        'switch off' : function(){
          var sensor = getDataFromKeyValue(jsData.sensorlist, 'name', 'WeMo Switch');
          socket_sensorAction(sensor, 'switchOff');
        },
        'add event' : function(){
          jsData.showModal('calendarManageModal',{form:null});
        },
        'add task' : function(){
          jsData.showModal('#tasksManageModal',{form:'form_tasklist'});
        },
        'open map' : function(){
          jsData.showModal('#companyManageModal', {form:'mapMarkers'});
        },
        'open setting' : function(){
          jsData.showModal('#settingModal');
        },
        'open notification' : function(){
          jsData.showModal('#notificationsModal');
        }
      }

      var commands = {
        '*anything': anything
      };

      // Add our commands to annyang
      annyang.addCommands(commands);

      annyang.addCallback('start', function() {
        console.log("annyang start");
        $scope.annyang.listening = true;
      });

      annyang.addCallback('soundstart', function() {
        console.log("annyang soundstart ");
        $scope.annyang.listening = true;
      });

      annyang.addCallback('end', function() {
        console.log("annyang end");
        $scope.annyang.listening = false;
      });

      annyang.addCallback('resultNoMatch', function() {
        console.log("annyang resultNoMatch");
        $scope.annyang.listening = false;
      });

      annyang.addCallback('error', function() {
        console.log("annyang error");
        //alert('annyang error')
        jsData.config.AnnyangEnabled = false;
      });

      // Start listening. You can call this here, or attach this call to an event, button, etc.
      annyang.debug(true);
      console.log("annyang Enabled");
      $scope.annyang = annyang;

    }
  }
  
  $scope.$on("$destroy", function() {
    annyang.abort();
    console.log("annyang disabled");
  });
})

.controller('BleCentralController', function($scope, $q, $timeout) {

  var $cordovaBluetoothLE = null;
  $scope.interval = 30 * 1000;

  $scope.init = function(sensorlist, cordovaBluetoothLE) {

    $cordovaBluetoothLE = cordovaBluetoothLE;

    jsData.BleCentralController = $scope;
    jsData.BleCentralController.cordovaBluetoothLE = $cordovaBluetoothLE;

    $scope.devices = sensorlist;
    $scope.virtualSensors = [
    { address:"A0",
    advertisement:"AgEFAwKAqgb/DQADAAARCUNDMjY1MCBTZW5zb3JUYWcFEggAIAMCCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    name:"CC2650 SensorTag",
    rssi:-64,
    status:"scanResult" },
    {address:"A1",
    advertisement:"AgEFAwKAqgb/DQADAAARCUNDMjY1MCBTZW5zb3JUYWcFEggAIAMCCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    name:"CC2650 SensorTag",
    rssi:-63,
    status:"scanResult" },
    {address:"A2",
    advertisement:"AgEFAwKAqgb/DQADAAARCUNDMjY1MCBTZW5zb3JUYWcFEggAIAMCCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    name:"CC2650 SensorTag",
    rssi:-63,
    status:"scanResult" },
    {address:"A3",
    advertisement:"AgEFAwKAqgb/DQADAAARCUNDMjY1MCBTZW5zb3JUYWcFEggAIAMCCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    name:"CC2650 SensorTag",
    rssi:-63,
    status:"scanResult" }
    ];

    checkInitialize().then(function() {
      console.log("checkInitialize completed");
      $scope.devices.forEach(function(sensor, i){
        if(sensor.name == "CC2650 SensorTag"){
          sensor.status = "Initializing";
          return $scope.connect(sensor);
        }
      });
    }).then(function(device) {
      console.log("BleCentralController init completed");
    }).catch(function(msg){
      console.log("BleCentralController init failed", msg);
      //$timeout($scope.init, 5000);
    });
  };

  $scope.connect = function(sensor){
    checkInitialize().then(function() {
      sensor.status = "Connecting";
      return connect(sensor);
    }).then(function(device){
      if(!device) return null;
      console.log('connected', sensor);
      if((sensor.name === 'CC2650 SensorTag') || (sensor.name === 'SensorTag 2.0')){
        sensor.lib = new SensorTagCommon(sensor.address, $cordovaBluetoothLE);
        sensor.status = "Discovering";
        return discover(sensor);
      }else{
        console.log("Unkown ble device", sensor);
      }
    }).then(function() {
      console.log("Process CC2650 sensor", sensor.lib.getInfo());
      //repeatly read sensor data
      sensor.status = "Processing";
      $scope.keep(sensor);
    }).catch(function(msg){
      console.log("connect failed", msg);
      if(msg.error == 'enable' && msg.message == 'Bluetooth not enabled'){
        console.log("bluetooth not enabled");
        sensor.status = "Bluetooth not enabled";
      }else if(msg.error == 'connect' && msg.message != 'No device address'){
        sensor.status = "Stopped";
        $timeout(function(){
          console.log("Address exist, try reconnect: ", sensor.address);
          reconnect(sensor);
        }, 5000);
      }else{
        sensor.status = "Stopped";
      }
    });
  }

  $scope.keep = function(sensor){
    checkInitialize().then(function() {
      return connect(sensor);
    }).then(function(){
      return discover(sensor);
    }).then(function(){
      if(findIndex($scope.virtualSensors, 'address', sensor.address) != null){
        var rand_nm = function() {
          var u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
          var v = 1 - Math.random();
          return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        }
        sensor.data = {
          IR_TEMPERATURE: {"amb_temp": 20 + rand_nm(), "obj_temp": 25 + rand_nm()},
          HUMIDITY: {"hum": 100 + rand_nm()*5},
          BAROMETRIC_PRESSURE: {"press": 1000 + rand_nm()*50},
          OPTICAL: {"lux": 100 + rand_nm()*5},
          MOVEMENT: {
            acc: {"x":rand_nm(),"y":rand_nm(),"z":rand_nm()},
            gyro: {"x":rand_nm(),"y":rand_nm(),"z":rand_nm()},
            mag: {"x":rand_nm(),"y":rand_nm(),"z":rand_nm()}
          },
          "altitude": rand_nm(),
        };
        socket_sensorUpdate(sensor.address, sensor.data);
        console.log("SensorTagCommon: getData() debug, return random data, read virtual sensor data after 60s", sensor.address);
        $timeout(function(){
          $scope.keep(sensor);
        }, $scope.interval);
        return;
      }

      sensor.lib.getData().then(function(data) {
        sensor.data = data;
        socket_sensorUpdate(sensor.address, sensor.data);

        //add on 2017 02-21
        var wemoSwitch = getDataFromKeyValue(jsData.sensorlist, 'name', 'WeMo Switch');
        if(wemoSwitch){
          if(data.OPTICAL.lux < 20){
            console.log("too dark "+data.OPTICAL.lux);
            socket_sensorAction(wemoSwitch, 'switchOn');
          }else{
            socket_sensorAction(wemoSwitch, 'switchOff');
          }
        }
        console.log("read sensor data after "+$scope.interval);
        $timeout(function(){
          $scope.keep(sensor);
        }, $scope.interval);
      }).fail(function(msg) {
        console.log("Cannot get sensor data: " + JSON.stringify(msg));
        sensor.status = "No Data";
        sensor.data = null;
        $scope.devices.splice(findIndex($scope.devices, 'address', sensor.address), 1);
        $scope.close(sensor);
      });
    }).catch(function(msg){
      console.log("Keep failed", msg);
      if(msg.error == 'connect' && msg.message != 'No device address'){
        sensor.status = "To reconnect";
        $timeout(function(){
          console.log("Address exist, try reconnect: ", sensor.address);
          reconnect(sensor);
        }, 5000);
      }else{
        sensor.status = "Stopped";
      }
    });
  }

  $scope.search = function(callback) {
    checkInitialize().then(function() {
      return find();
    }).then(function(device) {
      callback();
      /*
      console.log('found device', device);
      if(findIndex($scope.devices, 'address', device.address) == null){
        $scope.devices.push(device);
      }
      */
    }).catch(function(msg){
      console.log("search failed", msg);
      callback();
    });
  };
  
  $scope.close = function(device){
    console.log("disconnect", device.address);
    //close(device);
    return $cordovaBluetoothLE.close({address: device.address});
  }

  function checkInitialize() {
    var q = $q.defer();

    //////////////////////////////
    if(jsData.platform == 'win32'){
      setTimeout(function(){
        console.log("BleCentralController: Initialize() debug, assume Ble Initialized");
        q.resolve();
      }, 1000);
      return q.promise;
    }
    //////////////////////////////
    //console.log('$cordovaBluetoothLE', $cordovaBluetoothLE);
    $cordovaBluetoothLE.isInitialized().then(function(obj) {
      if (obj.isInitialized) {
        $cordovaBluetoothLE.enable().then(function(result){
          console.log("Initialized. ble enabled");
          return q.resolve();
        }).catch(function(result){
          if(result.error == "disable" && result.message == "Bluetooth not disabled"){
            console.log("Initialized. ble already enabled");
            return q.resolve();
          }else{
            console.log("Initialized. ble not enabled");
            return q.reject(result);
          }
        });
      } else {
        $cordovaBluetoothLE.initialize({request:true}).then(function(obj) {
          console.log('initialize Result', obj.message);
          return q.reject(obj.message);
        }, function(obj) {
          console.log(obj);
          if(obj.status == "disabled"){
            //bluetooth is not enabled
            console.log("enable ble...");
            $cordovaBluetoothLE.enable().then(function(obj){
              console.log("bluetooth not enabled");
              return q.reject(obj.message);
            }, function(obj){
              console.log("bluetooth enabled");
              return q.resolve();
            });
          }else{
            console.log("bluetooth enabled");
            return q.resolve();
          }
        });
      }
    }, function(obj) {
      console.log("isInitialize failed",obj.message);
      return q.reject(obj.message);
    });

    return q.promise;
  }

  function find(services) {
    var q = $q.defer();
    console.log("Finding device");

    var params = {
      scanTimeout: 10000,
      services:[],
      allowDuplicates: false,
      //scanTimeout: 15000,
    };

    //////////////////////////////
    $scope.virtualSensors.forEach(function(virtualSensor, i){
      (function(virtualSensor, i){
        setTimeout(function(){
          console.log("BleCentralController: find() debug");
          addDevice(virtualSensor);
        }, 1000 * (i+1) );
      })(virtualSensor, i);
    });
    //////////////////////////////
    if(jsData.platform == 'win32'){
      setTimeout(function(){q.resolve()}, params.scanTimeout);
      return q.promise;
    }
    //////////////////////////////

    if (services) {
      params.services = services;
    }

    if (window.cordova) {
      params.scanMode = bluetoothle.SCAN_MODE_LOW_POWER;
      params.matchMode = bluetoothle.MATCH_MODE_STICKY;
      params.matchNum = bluetoothle.MATCH_NUM_ONE_ADVERTISEMENT;
      //params.callbackType = bluetoothle.CALLBACK_TYPE_FIRST_MATCH;
    }

    $cordovaBluetoothLE.startScan(params).then(function() {
      console.log("Scan stopped without finding any devices");
      return q.resolve();
    }, function(obj) {
      return q.reject(obj.message);
    }, function(obj) {
      if (obj.advertisement && obj.advertisement.isConnectable === false) {
        console.log("Ignored Scan Result: " + JSON.stringify(obj));
        return;
      }
      if (obj.status == "scanResult") {
        //return q.resolve(obj);
        addDevice(obj);
      }
    });

    q.promise.finally(function() {
      $cordovaBluetoothLE.stopScan();
    });

    setTimeout(function(){q.resolve()}, params.scanTimeout);
    return q.promise;
  }

  function addDevice(device){
    if(findIndex($scope.devices, 'address', device.address) == null){
      console.log('found new device', device);
      device.status = 'Stopped';
      $scope.devices[$scope.devices.length] = device;
    }else{
      $.extend($scope.devices[findIndex($scope.devices, 'address', device.address)], device);
    }
  }

  function connect(device) {

    //////////////////////////////
    if(findIndex($scope.virtualSensors, 'address', device.address) == null){
      if(jsData.platform == 'win32'){
        var q = $q.defer();
        console.log('virtualSensors not found, address not exist: '+device.address);
        setTimeout(function(){
          return q.reject(device);
        }, 1000);
        return q.promise;
      }
    }else{
      var q = $q.defer();
      setTimeout(function(){
        console.log("BleCentralController: connect() debug, connected && discovered", device.address);
        return q.resolve(device);
      }, 1000);
      return q.promise;
    }
    //////////////////////////////

    return $cordovaBluetoothLE.isConnected({ address: device.address}).then(function(obj ) {
      if(obj.isConnected){
        console.log("Already Connected to device: " + device.name + " (" + device.address + ")");
        return;
      }else{
        console.log("Connecting to device: " + device.name + " (" + device.address + ")");
        return $cordovaBluetoothLE.wasConnected({
          address: device.address,
        }).then(function(obj) {
          console.log('wasConnected', obj);
          if(obj.wasConnected){
            console.log("Was Connected to device: " + device.name + " (" + device.address + ")");
            return $cordovaBluetoothLE.close({address: device.address}).then(function() {
              console.log("Closed to device: " + device.name + " (" + device.address + ")");
              return connect(device);
            });
          }else{
            console.log("Connecting to device: " + device.name + " (" + device.address + ")");
            return $cordovaBluetoothLE.connect({
              address: device.address,
              useResolve: true,
              timeout: 10000,
            });
          }
        });
      }
    }, function(obj){
      if(obj.error == "neverConnected"){
        console.log("neverConnected, Connecting to device: " + device.name + " (" + device.address + ")");
        return $cordovaBluetoothLE.connect({
          address: device.address,
          useResolve: true,
          timeout: 10000,
        });
      }
    });
  }

  function discover(device){
    //////////////////////////////
    if(findIndex($scope.virtualSensors, 'address', device.address) == null){
      if(jsData.platform == 'win32'){
        var q = $q.defer();
        setTimeout(function(){
          return q.reject(device);
        }, 1000);
        return q.promise;
      }
    }else{
      var q = $q.defer();
      setTimeout(function(){
        return q.resolve(device);
      }, 1000);
      return q.promise;
    }
    //////////////////////////////

    return $cordovaBluetoothLE.isDiscovered( { address: device.address}).then(function(obj ) {
      if(obj.isDiscovered){
        console.log("Already Discovered to device: " + device.name + " (" + device.address + ")");
        return device;
      }else{
        console.log("discovering to device: " + device.name + " (" + device.address + ")");
        return $cordovaBluetoothLE.discover({
          address: device.address,
          timeout: 20000,
        });
      }
    });
  }

  function process(device) {
    var promise = $q.when();

    for (var i = 0; i < device.services.length; i++) {
      var service = device.services[i];

      for (var j = 0; j < service.characteristics.length; j++) {
        var characteristic = service.characteristics[j];

        if (characteristic.properties.read) {
          promise = promise.then(read(device.address, service.uuid, characteristic.uuid));
        }
      }
    }

    return promise;
  }

  function read(address, service, characteristic) {
    return function() {
      var params = {address:address, service:service, characteristic:characteristic, timeout: 2000};

      console.log("Read : " + JSON.stringify(params));

      return $cordovaBluetoothLE.read(params).then(function(obj) {
        console.log("Read Success : " + JSON.stringify(obj));

        if (!obj.value) {
          return;
        }

        var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
        console.log("ASCII (" + bytes.length + "): " + $cordovaBluetoothLE.bytesToString(bytes));
        console.log("HEX (" + bytes.length + "): " + $cordovaBluetoothLE.bytesToHex(bytes));
      }, function(obj) {
        console.log("Read Error : " + JSON.stringify(obj));
      });
    };
  }

  function reconnect(device) {
    console.log("reconnect", device.address);
    return $cordovaBluetoothLE.reconnect({address: device.address}).then(function(){
      $scope.connect(device);
    });
  }

  function close(device) {
    if(findIndex($scope.devices, 'address', device.address) !== null){
      $scope.devices.splice(findIndex($scope.devices, 'address', device.address), 1);
    }
  }

  $scope.$on("$destroy", function() {
    $cordovaBluetoothLE.disable().then(function(msg){
      console.log("Ble disabled", msg);
    }).catch(function(err){
      console.log("Ble disable err", err);
    });
  });
})

.controller('UpnpController', function($scope, $q, $timeout) {
  $scope.init = function(sensorlist) {
    jsData.UpnpController = $scope;
    //jsData.BleCentralController.cordovaBluetoothLE = $cordovaBluetoothLE;

    $scope.devices = sensorlist;
    $scope.virtualSensors = [
    { address:"IASDAS0",
    name:"WeMo Switch",}
    ];

    if(!$scope.devices) return;
    if(typeof(serviceDiscovery) === "undefined"){
      console.log("UPNP is not defined")
      jsData.config.UpnpEnabled = false;
      return;
    }

    $scope.devices.forEach(function(sensor, i){
      if(sensor.name == "WeMo Switch"){
        sensor.status = "Initializing";
        $scope.connect(sensor);
      }
    });
  }

  $scope.connect = function(sensor){
    if(typeof(serviceDiscovery) === "undefined"){
      sensor.status = "Cannot find";
      console.log("UPNP is not defined")
      return;
    }

    var serviceType = "urn:Belkin:device:controllee:1";
    serviceDiscovery.getNetworkServices(serviceType, function(upnpResultDevices) {
      console.log('UPNP device', upnpResultDevices);
      upnpResultDevices.forEach(function(device){
        var sensor = getDataFromKeyValue($scope.sensorlist, 'address', device.USN);
        if(sensor != null){
          if(sensor.lib == null){
            sensor.lib = new wemoSwitch(device);
            sensor.status = sensor.lib.status;
            sensor.data = sensor.lib.data;
            sensor.action = {
              'switchOn': function(){
                console.log("switchOn");
                sensor.lib.switchOn().then(function(BinaryState){
                  sensor.data.BinaryState = BinaryState;
                  sensor.status = "Currently ON";
                  socket_sensorUpdate(sensor.address, sensor.data);
                });
              }, 
              'switchOff': function(){
                console.log("switchOff"); 
                sensor.lib.switchOff().then(function(BinaryState){
                  sensor.data.BinaryState = BinaryState;
                  sensor.status = "Currently OFF";
                  socket_sensorUpdate(sensor.address, sensor.data);
                });
              }, 
              'getStatus': function(){
                console.log("getStatus"); 
                sensor.lib.getStatus().then(function(BinaryState){
                  sensor.data.BinaryState = BinaryState;
                  if(BinaryState == "0"){
                    sensor.status = "Currently OFF";
                  }
                  if(BinaryState == "1"){
                    sensor.status = "Currently ON";
                  }
                  socket_sensorUpdate(sensor.address, sensor.data);
                });
              }, 
            }
            sensor.action['getStatus']();
          }
        }
      });
    }, function() {
      console.log("Error calling Service Discovery Plugin");
      sensor.status = "Cannot find";
    });
  }

  $scope.search = function(){
    if(typeof(serviceDiscovery) !== "undefined"){
      /**
       * Similar to the W3C specification for Network Service Discovery api 'http://www.w3.org/TR/discovery-api/'
       * @method getNetworkServices
       * @param {String} serviceType e.g. "urn:schemas-upnp-org:service:ContentDirectory:1", "ssdp:all", "urn:schemas-upnp-org:service:AVTransport:1"
       * @param {Function} success callback an array of services
       * @param {Function} failure callback 
       */
      //search WEMO Switch
      var serviceType = "urn:Belkin:device:controllee:1";
      serviceDiscovery.getNetworkServices(serviceType, function(upnpResultDevices) {
        console.log('UPNP device', upnpResultDevices);
        upnpResultDevices.forEach(function(device){
          var sensor = getDataFromKeyValue($scope.sensorlist, 'address', device.USN);
          if(sensor == null){
            var lib = new wemoSwitch(device);
            var sensor = {address:device.USN, name:lib.getName(), lib:lib, status:lib.status, data:lib.data};
            jsData.sensorlist.push(sensor);
          }else if(sensor.lib == null){
            sensor.lib = new wemoSwitch(device);
            sensor.status = sensor.lib.status;
            sensor.data = sensor.lib.data;
            //socket_sensorUpdate(device.USN, {status: lib.status});
            sensor.action = {
              'switchOn': function(){
                console.log("switchOn");
                sensor.lib.switchOn().then(function(BinaryState){
                  sensor.data.BinaryState = BinaryState;
                  sensor.status = "Currently ON";
                  socket_sensorUpdate(sensor.address, sensor.data);
                });
              }, 
              'switchOff': function(){
                console.log("switchOff"); 
                sensor.lib.switchOff().then(function(BinaryState){
                  sensor.data.BinaryState = BinaryState;
                  sensor.status = "Currently OFF";
                  socket_sensorUpdate(sensor.address, sensor.data);
                });
              }, 
              'getStatus': function(){
                console.log("getStatus"); 
                sensor.lib.getStatus().then(function(BinaryState){
                  sensor.data.BinaryState = BinaryState;
                  if(BinaryState == "0"){
                    sensor.status = "Currently OFF";
                  }
                  if(BinaryState == "1"){
                    sensor.status = "Currently ON";
                  }
                  socket_sensorUpdate(sensor.address, sensor.data);
                });
              }, 
            }
            sensor.action['getStatus']();
          }
        });
      }, function() {
        console.log("Error calling Service Discovery Plugin");
      });
    }
  }
});
