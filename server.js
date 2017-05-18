var app = require('express');
var http = require('http').Server(app);
var httpClient = require("http");
var request = require("request");
var io = require('socket.io')(http);
var Redis = require('ioredis');
var redis = new Redis();

var users = [];
var companies = [];

var notification = function(token, data, callback){
	//console.log('new notif', data);
	var options = {
		method: 'post',
		body: data, // Javascript object
		json: true, // Use,If you are sending JSON data
		url: 'http://ec2-54-254-191-134.ap-southeast-1.compute.amazonaws.com/api/notification/insert?token='+token,
	}

	request(options, function (err, res, body) {
		if (err) {
			console.log('Error :', err)
			return
		}
		console.log('notification Body :', body)
		callback(body);
	});
}

var getUserProfile = function(token, callback){
	var options = {
		method: 'get',
		url: 'http://ec2-54-254-191-134.ap-southeast-1.compute.amazonaws.com/api/user/profile?token='+token,
	}

	request(options, function (err, res, body) {
		if (err) {
			console.log('Error :', err)
			return
		}
		console.log('getUserProfile Body :', body)
		callback(body);
	});
}

var getCurrentUsers = function(company_id){
	var currentUsers = [];
	users.forEach(function(user){
		if(company_id == user.company_id){
			currentUsers.push(user);
		}
	});
	return currentUsers;
}

io.on('connection', function(socket) {

	var currentUser = null;
	var currentSocket = socket;

	function setCurrentUser(profile){
		this.currentUser = profile;
	}

	function getCurrentSocket(){
		return currentSocket;
	}
	
	function send(to, data){
		var currentUsers = getCurrentUsers(socket.company_id);
		if(currentUsers.length > 0){
			data.created_by = socket.email;
			data.created_at = new Date();
			currentUsers.forEach(function(user){
				if(to.indexOf('all') >= 0 || to.indexOf(user.email) >= 0){
					if(io.sockets.sockets[user.id]){
						io.sockets.sockets[user.id].emit('message', data);
					}
				}
			});
			console.log('Sent to ['+socket.company_id+']['+to+'] from '+socket.email+', data length: '+JSON.stringify(data).length)+', type: '+data.type;
		}else{
			console.log('Connot send to ['+socket.company_id+']['+to+'] from '+socket.email+'. receiver not found');
		}
	}
	
	// 當使用者觸發 set-token 時將他加入屬於他的 room
	socket.on('online', function(token) {
	
		//httpClient.request(options, callback).end();
		getUserProfile(token, function(response) {

			var profile = JSON.parse(response);
			//console.log(socket.id, profile.company_id, profile.email);
			
			if(profile.email != null && profile.company_id != null){

				var socket = getCurrentSocket();
				socket.token = token;
				socket.email = profile.email;
				socket.company_id = profile.company_id;
				socket.profile = profile;
				profile.id = socket.id;
				profile.address = socket.handshake.address;
				
				//return io.sockets.sockets[socket.id].emit('message', {type:'chat',data:'hihi'});
				/*
				for(var i = users.length -1; i >= 0; i-- ){
					if(users[i].address == profile.address){
						console.log("remove dulpication connection", profile.email);
						users.splice(i, 1);
					}
				};
				*/
				users.push(profile);
				console.log(profile.email + ' has connected to the server.'+(users.length));
				
				var currentUsers = getCurrentUsers(socket.company_id);
				var emailList = [];
				currentUsers.forEach(function(user){
					if(emailList.indexOf(user.email) < 0){
						emailList.push(user.email);
					}
				})
				
				send(['all'], {
					type: 'online',
					message: profile.email+' signed in.',
					data: emailList,
				});
				send([profile.email], {
					type: 'sensorData',
					message: 'sensorData',
					data: companies[socket.company_id],
				});
				notification(token, {
					delivered_to: ['all'],
					type: 'online',
					message: profile.email+' signed in.',
					data: JSON.stringify(emailList),
				}, function(response) {
				});				
			}
		});
	});

	socket.on('sensor', function(data) {
		if(data != null){
			send(['all'], {
				type: 'sensor',
				message: data.address,
				data: JSON.stringify(data.data),
			});
			notification(socket.token, {
				delivered_to: ['all'],
				type: 'sensor',
				message: data.address,
				data: JSON.stringify(data.data),
			}, function(response) {
			});	
			if(companies[socket.company_id] == null) {companies[socket.company_id] = [];}
			for(var i = companies[socket.company_id].length - 1; i >= 0 ; i--){
				if(companies[socket.company_id][i].address == data.address){
					companies[socket.company_id].splice(i, 1);
				}
			}
			companies[socket.company_id].push(data);
		}
	});

	socket.on('action', function(data) {
		send([socket.profile.master], {
			type: 'action',
			message: data.address,
			data: data.action,
		});
		notification(socket.token, {
			delivered_to: [socket.profile.master],
			type: 'action',
			message: data.address,
			data: JSON.stringify(data),
		}, function(response) {
		});	
	});

	socket.on('checkin', function(email) {
		send([socket.profile.master], {
			type: 'checkin',
			message: email,
			data: null,
		});
		notification(socket.token, {
			delivered_to: [socket.profile.master],
			type: 'checkin',
			message: email,
			data: null,
		}, function(response) {
		});	
	});
	
	socket.on('checkinResult', function(data) {
		send(data.to, {
			type: 'checkinResult',
			message: data.email,
			data: data.email,
		});
		notification(socket.token, {
			delivered_to: data.to,
			type: 'checkinResult',
			message: data.email,
			data: JSON.stringify(data.email),
		}, function(response) {
		});	
	});
	
	socket.on('message', function(data) {
		//data = {to:['all'], type:'sensor', data:{temp:12.5}}
		//data = {to:'a@a.com', message:{type:'chat', data:'hihihi'}}
		if(data.to == null || data.type == null || data.message == null)
			return socket.emit('invalid', 'Data not provided');

		send(data.to, {
			type: data.type,
			message: data.message,
			data: null
		});
		notification(socket.token, {
			delivered_to: data.to,
			type: data.type,
			message: data.message,
			data: JSON.stringify(data.data),
		}, function(result){  
		});
	});
	
	socket.on('disconnect', function(){
		console.log(socket.email + ' has disconnected from the server.');
		for(var i = users.length -1; i >= 0; i-- ){
			if(users[i].id == socket.id){
				users.splice(i, 1);
				break;
			}
		};

		var currentUsers = getCurrentUsers(socket.company_id);
		var emailList = [];
		currentUsers.forEach(function(user){
			//prevent dulpicate
			if(emailList.indexOf(user.email) < 0){
				emailList.push(user.email);
			}
		})
		send(['all'], {
			type: 'offline',
			message: socket.email+' signed out.',
			data: emailList,
		});
		notification(socket.token, {
			delivered_to: ['all'],
			type: 'offline',
			message: socket.email+' signed out.',
			data: JSON.stringify(emailList),
		}, function(response) {
		});
		
		socket.disconnect(0);
	});
});


redis.subscribe('notification', function(err, count) {
	console.log('connect!');
});

redis.on('message', function(channel, notification) {
	console.log(notification);
	notification = JSON.parse(notification);
	// 使用 to() 指定傳送的 room，也就是傳遞給指定的使用者
	io.to('token:' + notification.data.token).emit('notification', notification.data.message);
});

// 監聽 3000 port
http.listen(3000, function() {
	console.log('Listening on Port 3000');
});