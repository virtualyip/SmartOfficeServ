angular.module('starter.services', [])

.factory('ownApi', function() {

	var API_ENDPOINT = {
		url: 'http://ec2-54-254-191-134.ap-southeast-1.compute.amazonaws.com/api'
	};

	getToken = function(){
		return window.localStorage.getItem("token");
	};


	return {
		login : function(input){
			return $.post(API_ENDPOINT.url+"/login", input);
		},
		register : function(input){
			return $.post(API_ENDPOINT.url+"/register/company", input);
		},
    notification : {
      list : function(input){
        return $.get(API_ENDPOINT.url+"/notification?token="+getToken(), input);
      },
      read : function(){
        return $.get(API_ENDPOINT.url+"/notification/read?token="+getToken(), {});
      },
      insert : function(input){
        return $.post(API_ENDPOINT.url+"/notification/insert?token="+getToken(), input);
      },
    },
    user : {
      get : function(){
        return $.get(API_ENDPOINT.url+"/user/profile?token="+getToken(), {});
      },
      refresh : function(){
        return $.get(API_ENDPOINT.url+"/user/refresh?token="+getToken(), {});
      },
      list : function(){
        return $.get(API_ENDPOINT.url+"/user/list?token="+getToken(), {});
      },
      add : function(input){
        return $.post(API_ENDPOINT.url+"/user/addUser?token="+getToken(), input);
      },
      edit : function(input){
        return $.post(API_ENDPOINT.url+"/user/editUser?token="+getToken(), input);
      },
      delete : function(input){
        return $.post(API_ENDPOINT.url+"/user/deleteUser?token="+getToken(), input);
      },
      subscribe : function(input){
        return $.post(API_ENDPOINT.url+"/user/subscribe?token="+getToken(), input);
      }
    },
    map : {
      list : function(){
        return $.get(API_ENDPOINT.url+"/map/list?token="+getToken(), {});
      },
      markers : {
        get : function(input){
          return $.post(API_ENDPOINT.url+"/map/markers?token="+getToken(), input);
        },
        add : function(input){
          return $.post(API_ENDPOINT.url+"/map/markers/insert?token="+getToken(), input);
        },
        update : function(input){
          return $.post(API_ENDPOINT.url+"/map/markers/update?token="+getToken(), input);
        },
        delete : function(input){
          return $.post(API_ENDPOINT.url+"/map/markers/delete?token="+getToken(), input);
        },
      }
    },
    sensor : {
      list : function(){
        return $.get(API_ENDPOINT.url+"/sensor/list?token="+getToken(), {});
      },
      add : function(input){
        return $.post(API_ENDPOINT.url+"/sensor/insert?token="+getToken(), input);
      },
      edit : function(input){
        return $.post(API_ENDPOINT.url+"/sensor/update?token="+getToken(), input);
      },
      delete : function(input){
        return $.post(API_ENDPOINT.url+"/sensor/delete?token="+getToken(), input);
      },
    },
    asset : {
      list : function(){
        return $.get(API_ENDPOINT.url+"/asset/list?token="+getToken(), {});
      },
      add : function(input){
        return $.post(API_ENDPOINT.url+"/asset/insert?token="+getToken(), input);
      },
      edit : function(input){
        return $.post(API_ENDPOINT.url+"/asset/update?token="+getToken(), input);
      },
      delete : function(input){
        return $.post(API_ENDPOINT.url+"/asset/delete?token="+getToken(), input);
      },
      booking : {
        list : function(input){
          return $.post(API_ENDPOINT.url+"/asset/booking/list?token="+getToken(), input);
        },
        add : function(input){
          return $.post(API_ENDPOINT.url+"/asset/booking/insert?token="+getToken(), input);
        },
        edit : function(input){
          return $.post(API_ENDPOINT.url+"/asset/booking/update?token="+getToken(), input);
        },
        delete : function(input){
          return $.post(API_ENDPOINT.url+"/asset/booking/delete?token="+getToken(), input);
        },
      }
    },
    image : {
      uploadUrl : API_ENDPOINT.url+"/image/upload?token="+getToken(),
      get : function(path){
        if(!path) return;
        else return API_ENDPOINT.url+"/image/"+path+"?token="+getToken();
      },
      upload : function(input){
        return $.post(API_ENDPOINT.url+"/image/upload?token="+getToken(), input);
      },
      delete : function(input){
        return $.post(API_ENDPOINT.url+"/image/delete?token="+getToken(), input);
      },
    },
    /*
    getDashboard : function(){
      return $.get(API_ENDPOINT.url+"/dashboard?token="+getToken(), {});
    },
    getNotification : function(){
      return $.get(API_ENDPOINT.url+"/notification?token="+getToken(), {});
    },
    readNotification : function(){
      return $.get(API_ENDPOINT.url+"/notification/read?token="+getToken(), {});
    },
    insertNotification : function(input){
      input.token = getToken();
      return $.post(API_ENDPOINT.url+"/notification/insert?token="+getToken(), input);
    },
		addUser : function(input){
			return $.post(API_ENDPOINT.url+"/user/addUser?token="+getToken(), input);
		},
		editUser : function(input){
			return $.post(API_ENDPOINT.url+"/user/editUser?token="+getToken(), input);
		},
		deleteUser : function(input){
			return $.post(API_ENDPOINT.url+"/user/deleteUser?token="+getToken(), input);
		},
		userProfile : function(){
			return $.get(API_ENDPOINT.url+"/user/profile?token="+getToken(), {});
		},
		userList : function(){
			return $.get(API_ENDPOINT.url+"/user/list?token="+getToken(), {});
		},
		map : function(){
			return $.get(API_ENDPOINT.url+"/map?token="+getToken(), {});
		},
		mapMarkers : function(input){
			return $.post(API_ENDPOINT.url+"/map/markers?token="+getToken(), input);
		},
    image : function(path){
      if(!path) return null;
      //return $.get(API_ENDPOINT.url+"/image/"+path+"?token="+getToken(), {});
      return API_ENDPOINT.url+"/image/"+path+"?token="+getToken();
    },
    imageUpload : function(imgFile){
      return $.ajax({
        url: API_ENDPOINT.url+"/image/upload?token="+getToken(), 
        type: "POST",
        data: imgFile,
        processData: false, 
        contentType: false,
        //headers: {'Content-Type': undefined},
      });
    },
    imageUploadUrl : function(imgFile){
      return API_ENDPOINT.url+"/image/upload?token="+getToken();
    },
    imageSubmit : function(input){
      return $.post(API_ENDPOINT.url+"/image/submit?token="+getToken(), input);
    },
    imageDelete : function(input){
      return $.post(API_ENDPOINT.url+"/image/delete?token="+getToken(), input);
    }
    sensor : function(){
      return $.get(API_ENDPOINT.url+"/sensor?token="+getToken(), input);
    },
    addSensor : function(input){
      return $.post(API_ENDPOINT.url+"/sensor/insert?token="+getToken(), input);
    },
    editSensor : function(input){
      return $.post(API_ENDPOINT.url+"/sensor/edit?token="+getToken(), input);
    },
    deleteSensor : function(input){
      return $.post(API_ENDPOINT.url+"/sensor/delete?token="+getToken(), input);
    },
    asset : function(){
      return $.post(API_ENDPOINT.url+"/asset/list?token="+getToken(), input);
    },
    addAsset : function(input){
      return $.post(API_ENDPOINT.url+"/asset/insert?token="+getToken(), input);
    },
    editAsset : function(input){
      return $.post(API_ENDPOINT.url+"/asset/edit?token="+getToken(), input);
    },
    deleteAsset : function(input){
      return $.post(API_ENDPOINT.url+"/asset/delete?token="+getToken(), input);
    },
    */
  };
})

.factory('Chats', function() {
	// Might use a resource here that returns a JSON array

	// Some fake testing data
	var chats = [{
		id: 0,
		name: 'Ben Sparrow',
		lastText: 'You on your way?',
		face: 'img/ben.png'
	}, {
		id: 1,
		name: 'Max Lynx',
		lastText: 'Hey, it\'s me',
		face: 'img/max.png'
	}, {
		id: 2,
		name: 'Adam Bradleyson',
		lastText: 'I should buy a boat',
		face: 'img/adam.jpg'
	}, {
		id: 3,
		name: 'Perry Governor',
		lastText: 'Look at my mukluks!',
		face: 'img/perry.png'
	}, {
		id: 4,
		name: 'Mike Harrington',
		lastText: 'This is wicked good ice cream.',
		face: 'img/mike.png'
	}];

	return {
		all: function() {
			return chats;
		},
		remove: function(chat) {
			chats.splice(chats.indexOf(chat), 1);
		},
		get: function(chatId) {
			for (var i = 0; i < chats.length; i++) {
				if (chats[i].id === parseInt(chatId)) {
					return chats[i];
				}
			}
			return null;
		}
	};
});
