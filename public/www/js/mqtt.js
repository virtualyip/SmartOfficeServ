
      var client = false;
      const TOPIC = "aaa/#";
      var reconnectTimeout = 60000;
      function MQTTconnect() {
        client = new Paho.MQTT.Client("ws://54.254.191.134:18888/", "ClientId");

        client.onConnectionLost = function(responseObject) {
          if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:"+responseObject.errorMessage);
            setTimeout(MQTTconnect, reconnectTimeout);
          }
        };

        client.publish_message = function(topic, payload) {
          //var input_text = document.getElementById("mqtt_text");
          var payload = JSON.stringify(payload);
          var message = new Paho.MQTT.Message(payload);
          message.destinationName = topic;
          client.send(message);
        }

        client.onMessageArrived = function(message) {
          var topic = message.destinationName;
          var payload = message.payloadString;
          //console.log(topic,payload);

          var sensorname = topic.substr(topic.indexOf("/")+1);
          var sensor = getDataFromKeyValue(jsData.sensorlist, 'name', sensorname);
          if(sensor != null){
          	sensor.data = JSON.parse(payload);
            sensor.data.updated = moment().format('YYYY-MM-DD hh:mm:ss');
          }else{
            jsData.sensorlist.push({name: sensorname, data: JSON.parse(payload)});
          }
          sensor.markers.forEach(function(marker) {
            jsData.markerRefresh(marker);
            jsData.$apply();
          });
        };

        client.connect({
          userName: "user", // If your MQTT broker ask for user name/password.
          password: "password",
          onSuccess:function() {
            console.log("connectted");
            client.subscribe(TOPIC);
            //sensorSimulatorInterval = setInterval(sensorSimulator, 10000)
          },
          onFailure: function (message) {
            $('#status').val("Connection failed: " + message.errorMessage + "Retrying");
            setTimeout(MQTTconnect, reconnectTimeout);
          }
        });
      }

    var sensorSimulatorInterval;
    function sensorSimulator(){
        client.publish_message("aaa/Room401", {"objectTemp":"24.7", "humidity":"1.24",});
        client.publish_message("aaa/Room402", {"objectTemp":"25.7", "humidity":"2.24",});
        client.publish_message("aaa/Room403", {"objectTemp":"19.7", "humidity":"3.24",});
        client.publish_message("aaa/Room404", {"objectTemp":"23.7", "humidity":"4.24",});
        client.publish_message("aaa/Room405", {"objectTemp":"20.7", "humidity":"5.24",});
    }
