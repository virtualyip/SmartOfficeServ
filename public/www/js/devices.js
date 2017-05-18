
function wemoSwitch(device){
  device.url = device.LOCATION.split("//")[1].split("/")[0];
  device.host = device.url.split(":")[0];
  device.port = device.url.split(":")[1];
  device.path = 'http://'+device.host+":"+device.port;

  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(device.xml, "text/xml");
  var xmlDevice = xmlDoc.getElementsByTagName("device")[0];
  var xmlServices = xmlDevice.getElementsByTagName("serviceList")[0].getElementsByTagName("service");

  //EventEmitter.call(this);
  this.host = device.host;
  this.port = device.port;
  //this.deviceType = config.deviceType;
  this.USN = device.USN;
  this.UDN = this.USN.split("::")[0];
  this.subscriptions = {};
  //this.callbackURL = config.callbackURL;
  //this.device = config;
  this.error = undefined;
  this.path = device.path;
  this.name = xmlDevice.getElementsByTagName("friendlyName")[0].childNodes[0].nodeValue;
  this.status = "Initializing";
  this.data = {BinaryState:null};
  this.services = [];
  for(i = 0; i < xmlServices.length; i++) {
    var xmlService = xmlServices[i];
    var serviceType = xmlService.getElementsByTagName("serviceType")[0].innerHTML;
    this.services[serviceType] = {};
    this.services[serviceType].serviceId = xmlService.getElementsByTagName("serviceId")[0].innerHTML;
    this.services[serviceType].controlURL = xmlService.getElementsByTagName("controlURL")[0].innerHTML;
    this.services[serviceType].eventSubURL = xmlService.getElementsByTagName("eventSubURL")[0].innerHTML;
    this.services[serviceType].SCPDURL = xmlService.getElementsByTagName("SCPDURL")[0].innerHTML;
  }
  this.getStatus();
}
wemoSwitch.prototype.getName = function() {
  return this.name;
}
wemoSwitch.prototype.soapAction = function(serviceType, action, body) {
  var q = $.Deferred();

  var soapMessage =
  '<?xml version="1.0" encoding="utf-8"?> \
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"> \
  <soapenv:Body> \
  <u:'+action+' xmlns:u="'+serviceType+'">' + (body ? body : '') +
  '</u:'+action+'> \
  </soapenv:Body> \
  </soapenv:Envelope>';

  var self = this;
  $.ajax({
    url: this.path+this.services[serviceType].controlURL, 
    data: soapMessage, 
    type:'post', 
    dataType:'text', 
    contentType: "text/xml", 
    beforeSend: function(request) {
      request.setRequestHeader("SOAPAction",'"' + serviceType + '#' + action + '"')
    },
  }).success(function(text) {
    console.log('done.', text);
    var xmlDoc = $(text);
    var BinaryState = xmlDoc.find("BinaryState")[0].innerHTML;
    console.log('done.', xmlDoc, BinaryState);
    //var xmlBody = xmlDoc.getElementsByTagName("s:Envelope")[0].getElementsByTagName("s:Body")[0];
    //var BinaryState = xmlBody.getElementsByTagName("u:GetBinaryStateResponse")[0].getElementsByTagName("BinaryState")[0].childNodes[0].nodeValue;
    //console.log('done.', xmlBody, BinaryState);
    self.setStatus(BinaryState);
    q.resolve(BinaryState);
  }).error(function(err) {
    console.log("soapAction err", err); 
    q.reject();
  });
  /*
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('POST', this.path+this.services[serviceType].controlURL, true);
  xmlhttp.setRequestHeader("SOAPAction", '"' + serviceType + '#' + action + '"');
  xmlhttp.setRequestHeader("Content-Type", "text/xml");

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 200) {
        console.log('done.', xmlhttp.responseText);
        var xmlDoc = $(xmlhttp.responseText);
        var BinaryState = xmlDoc.find("BinaryState")[0].innerHTML;
        console.log('done.', xmlDoc, BinaryState);
        //var xmlBody = xmlDoc.getElementsByTagName("s:Envelope")[0].getElementsByTagName("s:Body")[0];
        //var BinaryState = xmlBody.getElementsByTagName("u:GetBinaryStateResponse")[0].getElementsByTagName("BinaryState")[0].childNodes[0].nodeValue;
        //console.log('done.', xmlBody, BinaryState);
        self.setStatus(BinaryState);
        //q.resolve(BinaryState);
      }
    };
    q.reject();
  }
  // Send the POST request
  xmlhttp.send(soapMessage);
  */
  return q.promise();
}
wemoSwitch.prototype.switchOn = function(){
  console.log("switchOn");
  return this.soapAction('urn:Belkin:service:basicevent:1', 'SetBinaryState', '<BinaryState>1</BinaryState>').then(function() {
    return this.getStatus();
  }.bind(this));
}
wemoSwitch.prototype.switchOff = function(){
  console.log("switchOff");
  return this.soapAction('urn:Belkin:service:basicevent:1', 'SetBinaryState', '<BinaryState>0</BinaryState>').then(function() {
    return this.getStatus();
  }.bind(this));
}
wemoSwitch.prototype.getStatus = function(){
  console.log("getStatus");
  /*
  var q = $.Deferred();function(BinaryState){
    console.log("BinaryState updte",BinaryState);
    this.data.BinaryState = BinaryState;
    if(BinaryState == "0"){
      this.status = "Currently OFF";
    }
    if(BinaryState == "1"){
      this.status = "Currently ON";
    }
    q.resolve(BinaryState);
  }.bind(this)
  return q.promise();
  */
  return this.soapAction('urn:Belkin:service:basicevent:1', 'GetBinaryState', null);
}
wemoSwitch.prototype.setStatus = function(BinaryState){
  this.data.BinaryState = BinaryState;
  if(BinaryState == "0"){
    this.status = "Currently OFF";
  }
  if(BinaryState == "1"){
    this.status = "Currently ON";
  }
}
wemoSwitch.prototype._subscribe  = function(serviceType){
  var q = $.Deferred();
  if (!this.services[serviceType]) {
    throw new Error('Service ' + serviceType + ' not supported by ' + this.UDN);
  }
  if (!this.callbackURL) {
    throw new Error('Can not subscribe without callbackURL');
  }
  if (this.subscriptions[serviceType] && this.subscriptions[serviceType] === 'PENDING') {
    console.log('subscription still pending');
    return;
  }
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('SUBSCRIBE', this.path+this.services[serviceType].eventSubURL, true);
  if (!this.subscriptions[serviceType]) {
    // Initial subscription
    this.subscriptions[serviceType] = 'PENDING';
    console.log('Initial subscription - Device: %s, Service: %s', this.UDN, serviceType);
    xmlhttp.setRequestHeader("CALLBACK", '<' + this.callbackURL + '/' + this.UDN + '>');
    xmlhttp.setRequestHeader("NT", "upnp:event");
  } else {
    // Subscription renewal
    console.log('Renewing subscription - Device: %s, Service: %s', this.UDN, serviceType);
    xmlhttp.setRequestHeader("SID", "this.subscriptions[serviceType]");
  }
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 200) {
        console.log('done.', xmlhttp);
        // Renew after 150 seconds
        this.subscriptions[serviceType] = res.headers.sid;
        setTimeout(this._subscribe.bind(this), 150 * 1000, serviceType);
        return q.resolve(xmlhttp.responseXML);
      }else{
        // Try to recover from failed subscription after 2 seconds
        debug('Subscription request failed with HTTP %s', res.statusCode);
        this.subscriptions[serviceType] = null;
        setTimeout(this._subscribe.bind(this), 2000, serviceType);
      }
    }
    this.subscriptions[serviceType] = null;
    this.error = err.code;
    return q.reject();
  }
  // Send the POST request
  xmlhttp.send();
  return q.promise();
}




function SensorTagCommon(address, $cordovaBluetoothLE) {
  this.bluetoothle = $cordovaBluetoothLE; //need bytesToEncodedString(),encodedStringToBytes(), write(), read() function
  this.address = address;

  // http://processors.wiki.ti.com/index.php/SensorTag_User_Guide
  this.sensors = [
  {type:'IR_TEMPERATURE',uuid:'F000AA00-0451-4000-B000-000000000000', data:'F000AA01-0451-4000-B000-000000000000', config:'F000AA02-0451-4000-B000-000000000000', period:'F000AA03-0451-4000-B000-000000000000'},
  {type:'HUMIDITY',uuid:'F000AA20-0451-4000-B000-000000000000', data:'F000AA21-0451-4000-B000-000000000000', config:'F000AA22-0451-4000-B000-000000000000', period:'F000AA23-0451-4000-B000-000000000000'},
  {type:'BAROMETRIC_PRESSURE',uuid:'F000AA40-0451-4000-B000-000000000000', data:'F000AA41-0451-4000-B000-000000000000', config:'F000AA42-0451-4000-B000-000000000000', period:'F000AA44-0451-4000-B000-000000000000'},
  {type:'OPTICAL',uuid:'F000AA70-0451-4000-B000-000000000000', data:'F000AA71-0451-4000-B000-000000000000', config:'F000AA72-0451-4000-B000-000000000000', period:'F000AA73-0451-4000-B000-000000000000'},
  {type:'MOVEMENT',uuid:'F000AA80-0451-4000-B000-000000000000', data:'F000AA81-0451-4000-B000-000000000000', config:'F000AA82-0451-4000-B000-000000000000', period:'F000AA83-0451-4000-B000-000000000000'},
  ];

}

SensorTagCommon.prototype.getAddress = function() {
  return this.address;
}

SensorTagCommon.prototype.getInfo = function() {
  return {
    address: this.address,
    type: 'Sensor tag',
    model: 'cc2650',
    version: '1.0',
    sensors: this.sensors,
  }
}

SensorTagCommon.prototype.getData = function() {
  var q = $.Deferred();

  var self = this;
  console.log("enableAllSensors");
  this.enableAllSensors().then(function(){
    console.log("readAllSensors");
    return self.readAllSensors();
  }).then(function(){
    console.log("read all completed, converting");
    console.log(self.sensors);
    var data = {};
    for(var i=0; i < self.sensors.length; i++){
      var sensor = self.sensors[i];
      console.log("["+sensor.type+"] converting data from ["+sensor.value+"]="+self.encodedStringToBytes(sensor.value));
      data[sensor.type] = self.convertDataToValue(sensor.type, sensor.value);
      console.log("["+sensor.type+"] converted data from ["+sensor.value+"] to ",data[sensor.type]);
    }
    return q.resolve(data);
  });
  return q.promise();
}

SensorTagCommon.prototype.bytesToEncodedString = function(bytes) {
  return this.bluetoothle.bytesToEncodedString(bytes);
}

SensorTagCommon.prototype.encodedStringToBytes = function(string) {
  return this.bluetoothle.encodedStringToBytes(string);
}

SensorTagCommon.prototype.byteArrayToLong = function(/*byte[]*/byteArray) {
  var value = 0;
  for ( var i = byteArray.length - 1; i >= 0; i--) {
    value = (value * 256) + byteArray[i];
  }
  return value;
};

SensorTagCommon.prototype.byteArrayToSignedLong = function(/*byte[]*/byteArray) {
  var value = this.byteArrayToLong(byteArray) & 0xffffffff;
  var sign = value & (0xf0000000);
  var i = ((value & 0x0fffffff) << 8) | value[1];
  if (sign) {
    i = -i;
  }
  return i;
};

SensorTagCommon.prototype.writeCharacteristic = function(address, serviceUuid, characteristicUuid, bytes) {
  var q = $.Deferred();

  var params = {
    address : address,
    service : serviceUuid,
    characteristic : characteristicUuid,
    value : this.bytesToEncodedString(bytes),
  };

  this.bluetoothle.write(params).then(function(obj) {
    console.log("Write Success : " + JSON.stringify(obj));
    q.resolve(obj);
  }, function(obj){
    console.log("Write failed : " + JSON.stringify(obj));
    q.reject();
  });
  return q.promise();
}

SensorTagCommon.prototype.readDataCharacteristic = function(address, serviceUuid, characteristicUuid, sensor) {
  var q = $.Deferred();
  var sensor = sensor;

  var params = {
    address: address, 
    service: serviceUuid, 
    characteristic: characteristicUuid, 
    timeout: 2000
  };
  this.bluetoothle.read(params).then(function(obj) {
    if (!obj.value) {
      console.log("Read Success not no value inside: " + JSON.stringify(obj));
      return q.reject();
    }
    console.log("Read Success : " + JSON.stringify(obj));
    sensor.value = obj.value;
    q.resolve(obj.value);
  }, function(obj){
    console.log("Read failed : " + JSON.stringify(obj));
    q.reject();
  });
  return q.promise();
}

SensorTagCommon.prototype.enableAllSensors = function() {
  var promises = [];
  for(var i=0; i < this.sensors.length; i++){
    var sensor = this.sensors[i];
    if(sensor.type == 'MOVEMENT'){
      promises.push(this.writeCharacteristic(this.getAddress(), sensor.uuid, sensor.config, [0xff, 0x00]));
    }else{
      promises.push(this.writeCharacteristic(this.getAddress(), sensor.uuid, sensor.config, [0x01]));
    }
  }
  return $.when.apply(undefined, promises).promise();
}

SensorTagCommon.prototype.disableAllSensors = function() {
  var promises = [];
  for(var i=0; i < this.sensors.length; i++){
    var sensor = this.sensors[i];
    if(sensor.type == 'MOVEMENT'){
      promises.push(this.writeCharacteristic(this.getAddress(), sensor.uuid, sensor.config, [0x00, 0x00]));
    }else{
      promises.push(this.writeCharacteristic(this.getAddress(), sensor.uuid, sensor.config, [0x00]));
    }
  };
  return $.when.apply(undefined, promises).promise();
}

SensorTagCommon.prototype.readAllSensors = function() {
  var promises = [];
  var self = this;
  for(var i=0; i < this.sensors.length; i++){
    var sensor = this.sensors[i];
    promises.push(self.readDataCharacteristic(self.getAddress(), sensor.uuid, sensor.data, sensor));
  };
  return $.when.apply(undefined, promises).promise();
}

SensorTagCommon.prototype.convertDataToValue = function(type, data) {
  var bytes = this.encodedStringToBytes(data);
  if(type == 'IR_TEMPERATURE'){
    var obj_temp = (parseInt(bytes[0] + (bytes[1] << 8)) >> 2) * 0.03125;
    var amb_temp = (parseInt(bytes[2] + (bytes[3] << 8)) >> 2) * 0.03125;
    //console.log(obj_temp, amb_temp);
    return {obj_temp:obj_temp, amb_temp:amb_temp};
  }
  if(type == 'HUMIDITY'){
    var temp = (parseInt(bytes[0] + (bytes[1] << 8)) / 65536.0) * 165 - 40;
    var hum =  (parseInt(bytes[2] + (bytes[3] << 8)) / 65536.0) * 100;
    //console.log(temp, hum);
    return {temp:temp, hum:hum};
  }
  if(type == 'BAROMETRIC_PRESSURE'){
    var temp = parseInt(bytes[0] + (bytes[1] << 8) + (bytes[2] << 16)) / 100;
    var press = parseInt(bytes[3] + (bytes[4] << 8) + (bytes[5] << 16)) / 100;
    //console.log(temp, press);
    return {temp:temp, press:press};
  }
  if(type == 'OPTICAL'){
    var m = (bytes[0] + (bytes[1] << 8)) & 0x00000FFF;
    var e = ((bytes[0] + (bytes[1] << 8)) & 0x0000F000) >> 12;
    var lux = m * (0.01 * Math.pow(2.0, e));
    //console.log((bytes[0] << 8) + bytes[1], m, e, lux);
    return {lux:lux};
  }
  if(type == 'MOVEMENT'){
    var gyro = {}; var acc = {}; var mag = {};
    var byteToSignedLong = function(value) {
      var sign = value & (1 << 15); //& 1000000000000000
      var int = value  & (0xFF - (1 << 15)); //& 011111111111111
      if(sign > 0)
        return -int;
      else
        return int;
    };
    gyro.x = ((((bytes[1] << 8) | bytes[0]) << 16) >> 16);
    gyro.y = ((((bytes[3] << 8) | bytes[2]) << 16) >> 16);
    gyro.z = ((((bytes[5] << 8) | bytes[4]) << 16) >> 16);
    acc.x = ((((bytes[7] << 8) | bytes[6]) << 16) >> 16);
    acc.y = ((((bytes[9] << 8) | bytes[8]) << 16) >> 16);
    acc.z = ((((bytes[11] << 8) | bytes[10]) << 16) >> 16);
    mag.x = ((((bytes[13] << 8) | bytes[12]) << 16) >> 16);
    mag.y = ((((bytes[15] << 8) | bytes[14]) << 16) >> 16);
    mag.z = ((((bytes[17] << 8) | bytes[16]) << 16) >> 16);
    //console.log(gyro, acc, mag);
    return {gyro:gyro,acc:acc,mag:mag};
  }
  return null;
}