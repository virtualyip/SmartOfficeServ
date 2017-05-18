$.getScript("https://apis.google.com/js/client.js");

showSpinner = function(){
	document.getElementById('spinner').style.display = 'block';
}

hideSpinner = function(){
	document.getElementById('spinner').style.display = 'none';
}

/**
 * Check if current user has authorized this application.
 */
 checkAuth = function(immediate) {
 	gapi_client.checkAuth(immediate);
 }

 handleAuthClick = function(event) {
 	gapi_client.handleAuthClick(event);
 }

 var gapi_client = new function()
 {

	// Your Client ID can be retrieved from your project in the Google
	// Developer Console, https://console.developers.google.com

	this.CLIENT_ID = '934310179470-gpg500orac4kp12f5g0tipg27rr51rqh.apps.googleusercontent.com';

	//android
	//this.CLIENT_ID = '934310179470-ll1fm5kqgust1vrkqdonrvg8iarhg64j.apps.googleusercontent.com';

	this.SCOPES = ["https://www.googleapis.com/auth/calendar", 
	'https://www.googleapis.com/auth/tasks', 
	'https://mail.google.com/', 
	'https://www.googleapis.com/auth/userinfo.email'];

	this.access_token = "";

	this.getAccessToken = function(){
		if(this.access_token == ""){
			return window.localStorage.getItem("access_token");
		}else{
			return this.access_token;
		}
	}

	/**
	 * Check if current user has authorized this application.
	 */
	 this.checkAuth = function(immediate) {
	 	//showSpinner();
	 	//var q = $.Deferred();
	 	return gapi.auth2.authorize(
	 	{
	 		'client_id': this.CLIENT_ID,
	 		'scope': this.SCOPES.join(' '),
	 		'immediate': immediate
	 	});
	 	//return q.promise();
	 }

	 this.logout = function() {
	 	//showSpinner();
	 	gapi.auth2.signOut();
	 }

	/**
	 * Handle response from authorization server.
	 *
	 * @param {Object} authResult Authorization result.
	 */
	 this.handleAuthResult = function(authResult) {

	 	//hideSpinner();
	 	console.log(authResult);

	 	var authorizeDiv = document.getElementById('authorize-div');
	 	if (authResult && !authResult.error) {
			// Hide auth UI, then load client library.
			authorizeDiv.style.display = 'none';

			//console.log(authResult);
			window.localStorage.setItem("access_token", authResult.access_token);
			gapi_client.access_token = authResult.access_token;
			gapi_client.loadApi();
		} else {
			// Show auth UI, allowing the user to initiate authorization by
			// clicking authorize button.
			authorizeDiv.style.display = 'inline';
		}
	}

	this.loadApi = function(){
		console.log("No Api loaded");
	}

	/**
	 * Initiate auth flow in response to user clicking authorize button.
	 *
	 * @param {Event} event Button click event.
	 */
	 this.handleAuthClick = function(event) {
	 	gapi.auth.authorize(
	 		{client_id: CLIENT_ID, scope: SCOPES, immediate: false},
	 		handleAuthResult);
	 	return false;
	 }

	/**
	 * Load Google client library.
	 */
	 this.loadCalendarApi = function(callback) {
	 	gapi.client.load('calendar', 'v3', callback);
	 }

	 this.loadTasksApi = function(callback) {
	 	gapi.client.load('tasks', 'v1', callback);
	 }

	 this.loadGmailApi = function(callback) {
	 	gapi.client.load('gmail', 'v1', callback);
	 }

	 this.loadPlusApi = function(callback) {
	 	gapi.client.load('plus', 'v1', callback);
	 }

	 this.calendarApi = new function(){
		//get list data
		this.listUpcomingEvents = function(input, callback) {
			var predefined = {
				'calendarId': 'primary',
				'timeMin': (new Date()).toISOString(),
				'showDeleted': false,
				'singleEvents': true,
				'maxResults': 10,
				'orderBy': 'startTime'
			}

			$.ajax({
				method: "GET", 
				url: "https://content.googleapis.com/calendar/v3/calendars/primary/events?access_token="+gapi_client.getAccessToken(),
				data: $.extend(predefined, input),
			}).done(function(resp){
				var events = resp.items;
				if (events && events.length > 0) {
					//console.log(events);	
					callback(events);
				} else {
					console.log('No upcoming events found.');
					callback([]);
				}
			});
			/*
			var request = gapi.client.calendar.events.list($.extend(predefined, input));

			request.execute(function(resp) {
				var events = resp.items;
				if (events && events.length > 0) {
					//console.log(events);	
					callback(events);
				} else {
					console.log('No upcoming events found.');
				}
			});
			*/
		}

		this.events = new function(){
			this.get = function(input){
				var predefined = {};

				return $.ajax({
					type: "GET", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/calendar/v3/calendars/calendarId/events/eventId?access_token="+gapi_client.getAccessToken()+"&calendarId="+input.calendarId+"&eventId="+input.eventId,
					data: JSON.stringify($.extend(predefined, input.resource)),
				});
			}

			this.insert = function(input, callback){
				var predefined = {};

				return $.ajax({
					type: "POST", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/calendar/v3/calendars/calendarId/events?access_token="+gapi_client.getAccessToken()+"&calendarId="+input.calendarId,
					data: JSON.stringify($.extend(predefined, input.resource)),
				});
			}

			this.update = function(input){
				var predefined = {};

				return $.ajax({
					type: "PUT", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/calendar/v3/calendars/calendarId/events/eventId?access_token="+gapi_client.getAccessToken()+"&calendarId="+input.calendarId+"&eventId="+input.eventId,
					data: JSON.stringify($.extend(predefined, input.resource)),
				});
			}

			this.delete = function(input){
				var predefined = {sendNotifications: false};

				return $.ajax({
					type: "DELETE", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/calendar/v3/calendars/calendarId/events/eventId?access_token="+gapi_client.getAccessToken()+"&calendarId="+input.calendarId+"&eventId="+input.eventId,
					//data: JSON.stringify($.extend(predefined, input)),
				});
			}
		}
	}

	this.tasksApi = new function(){

		this.listTasklists = function(input, callback) {
			var predefined = {
				'maxResults': 10,
			}

			$.ajax({
				method: "GET", 
				url: "https://www.googleapis.com/tasks/v1/users/@me/lists?access_token="+gapi_client.getAccessToken(),
				data: $.extend(predefined, input),
			}).done(function(resp){
				var tasklists = resp.items;
				
				if (tasklists && tasklists.length > 0) {
					//console.log(tasklists);
					callback(tasklists);
				}else{
					console.log('No tasklists found.');
					callback([]);
				}
			});
			/*
			var request = gapi.client.tasks.tasklists.list($.extend(predefined, input));

			request.execute(function(resp) {
				var tasklists = resp.items;
				
				if (tasklists && tasklists.length > 0) {
					//console.log(tasklists);
					callback(tasklists);
				}else{
					console.log('No tasklists found.');
				}
			});
			*/
		}

		//get list details
		this.getTasks = function(tasklists, input, callback){

			if (tasklists && tasklists.length > 0) 
			{
				for (var i = 0; i < tasklists.length; i++) {

					var tasklist = tasklists[i];

					(function(tasklist){

						var predefined = {
							'tasklist': tasklist.id,
							'maxResults': 10,
						}

						$.ajax({
							method: "GET", 
							url: "https://www.googleapis.com/tasks/v1/lists/tasklist/tasks?access_token="+gapi_client.getAccessToken(),
							data: $.extend(predefined, input),
						}).done(function(resp){
							//console.log(resp);
							var tasks = resp.items;

							if (tasks && tasks.length > 0) {
								tasklist.tasks = tasks;
							} else {
								console.log('No tasks found.', tasklist);
								tasklist.tasks = [];
							}

							callback();
						});

					})(tasklist)
					/*
					var request = gapi.client.tasks.tasks.list($.extend(predefined, input));
					request.execute(function(resp) {
						//console.log(resp);
						var tasks = resp.items;

						if (tasks && tasks.length > 0) {

							//find the list id from the selfLink
							for (var j = 0; j < tasklists.length; j++) {
								if(tasks[0].selfLink.indexOf(tasklists[j].id) >= 0){
									callback(tasklists[j].id, tasks);
								}
							}

						} else {
							console.log('No tasks found.');
						}
					});
					*/
				}
			} else {
				console.log('No task list found.');
			}

		}

		this.tasklists = new function(){
			this.insert = function(input, callback){
				var predefined = {};

				return $.ajax({
					type: "POST", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/tasks/v1/users/@me/lists?access_token="+gapi_client.getAccessToken(),
					data: JSON.stringify($.extend(predefined, input.resource)),
				});
			}

			this.update = function(input){
				var predefined = {};

				return $.ajax({
					type: "PUT", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/tasks/v1/users/@me/lists/tasklist?access_token="+gapi_client.getAccessToken()+"&tasklist="+input.tasklist,
					data: JSON.stringify($.extend(predefined, input.resource)),
				});
			}

			this.delete = function(input){
				var predefined = {};

				return $.ajax({
					type: "DELETE", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/tasks/v1/users/@me/lists/tasklist?access_token="+gapi_client.getAccessToken()+"&tasklist="+input.tasklist,
					//data: JSON.stringify($.extend(predefined, input)),
				});
			}
		}
		this.tasks = new function(){
			this.insert = function(input, callback){
				var predefined = {};

				return $.ajax({
					type: "POST", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/tasks/v1/lists/tasklist/tasks?access_token="+gapi_client.getAccessToken()+"&tasklist="+input.tasklist,
					data: JSON.stringify($.extend(predefined, input.resource)),
				});
			}

			this.update = function(input){
				var predefined = {};

				return $.ajax({
					type: "PUT", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/tasks/v1/lists/tasklist/tasks/task?access_token="+gapi_client.getAccessToken()+"&tasklist="+input.tasklist+"&task="+input.task,
					data: JSON.stringify($.extend(predefined, input.resource)),
				});
			}

			this.delete = function(input){
				var predefined = {};

				return $.ajax({
					type: "DELETE", 
					headers: {"Content-Type": "application/json"},
					url: "https://www.googleapis.com/tasks/v1/lists/tasklist/tasks/task?access_token="+gapi_client.getAccessToken()+"&tasklist="+input.tasklist+"&task="+input.task,
					//data: JSON.stringify($.extend(predefined, input)),
				});
			}
		}
	}

	this.gmailApi = new function(){
		this.listMessages = function(input, callback) {
			var predefined = {
				'userId': 'me',
				maxResults: 30,
				q: '-in:chats',
			};

			$.ajax({
				method: "GET", 
				url: "https://www.googleapis.com/gmail/v1/users/userId/messages?access_token="+gapi_client.getAccessToken(),
				data: $.extend(predefined, input),
			}).done(function(resp){
				var messages = resp.messages;

				if (messages.length > 0) {
					callback( messages);
				} else {
					console.log('No messages found.');
					callback([]);
				}
			});
			/*
			var request = gapi.client.gmail.users.messages.list($.extend(predefined, input));

			request.execute(function(resp) {
				var messages = resp.messages;

				if (messages.length > 0) {
					 callback( messages);
				} else {
					console.log('No messages found.');
				}
			});
			*/
		}

		this.listThreads = function(input, callback) {
			var predefined = {
				'userId': 'me',
				maxResults: 30,
				q: '-in:chats',
			};

			$.ajax({
				method: "GET", 
				url: "https://www.googleapis.com/gmail/v1/users/userId/threads?access_token="+gapi_client.getAccessToken(),
				data: $.extend(predefined, input),
			}).done(function(resp){
				var threads = resp.threads;

				if (threads && threads.length > 0) {
					threads.nextPageToken = resp.nextPageToken;
					callback(threads);
				} else {
					console.log('No thread found.');
					callback([]);
				}
			});
			/*
			var request = gapi.client.gmail.users.threads.list($.extend(predefined, input));

			request.execute(function(resp) {
				var threads = resp.threads;

				if (threads && threads.length > 0) {
					threads.nextPageToken = resp.nextPageToken;
					callback(threads);
				} else {
					console.log('No thread found.');
				}
			});
			*/
		}

		this.getThread = function(threadlists, input, callback){
			for(var i = 0; i < threadlists.length; i++){

				var threadlist = threadlists[i];

				var predefined = {
					userId: 'me',
					id: threadlist.id,
					format: 'minimal',
				}

				$.ajax({
					method: "GET", 
					url: "https://www.googleapis.com/gmail/v1/users/userId/threads/id?access_token="+gapi_client.getAccessToken(),
					data: $.extend(predefined, input),
				}).done(function(resp){
					//console.log(resp);
					var messages = resp.messages;
					callback( messages);
					//testing
					//getMessage(messages[messages.length-1].id, 'full');
					//jsData._threads = messages;
					//jsData.showRead = true;
						//$('#myModal').modal('show');
					});
				/*
				var request = gapi.client.gmail.users.threads.get($.extend(predefined, input));

				request.execute(function(resp) {
					//console.log(resp);
					var messages = resp.messages;
					callback( messages);
					//testing
					//getMessage(messages[messages.length-1].id, 'full');
					//jsData._threads = messages;
					//jsData.showRead = true;
						//$('#myModal').modal('show');
				});
				*/
			}
		}

		this.getMessage = function(messages, input, callback){
			for(var i = 0; i < messages.length; i++){
				var message = messages[i];

				var predefined = {
					userId: 'me',
					id: message.id,
					format: 'minimal',
				}

				$.ajax({
					method: "GET", 
					url: "https://www.googleapis.com/gmail/v1/users/userId/messages/id?access_token="+gapi_client.getAccessToken(),
					data: $.extend(predefined, input),
				}).done(function(resp){
					//console.log(resp);
					callback( resp);
				});
				/*
				var request = gapi.client.gmail.users.messages.get($.extend(predefined, input));

				request.execute(function(resp) {
					//console.log(resp);
					 callback( resp);
				});
				*/
			}
		}
	}

	this.plusApi = new function()
	{
		this.getProfile = function(){
			return $.ajax({
				method:"GET", 
				url:"https://www.googleapis.com/plus/v1/people/me?access_token="+gapi_client.getAccessToken(),
			});
		}
	}
}

listUpcomingEvents = function(){
	gapi_client.calendarApi.listUpcomingEvents(null, function(events){

		console.log('listUpcomingEvents', events);
		jsData.events = events;
		sorting(jsData);
		jsData.$apply();
		jsData.dashboardUpdate();
		//$('#calendar').fullCalendar( 'removeEventSources' );
		//$('#calendar').fullCalendar( 'addEventSource', {events : jsData.events});
	});
}

listThreads = function(input){
	gapi_client.gmailApi.listThreads(input, function(threadlists){
		console.log('listThreads', threadlists);
		jsData.threadlists = threadlists;
		gapi_client.gmailApi.getThread(threadlists, {format:'metadata'}, function(messages){

			threadlists[findIndex(threadlists, 'id', messages[0].id)].messages = messages;
			jsData.$apply();

		});
	});
}

getUnreadMessage = function(){
	//count unread email
	gapi_client.gmailApi.listMessages({labelIds:"UNREAD", maxResults: 100}, function(threadlists){
		console.log('getUnreadMessage', threadlists);
		jsData.unread_emails = threadlists;
		jsData.dashboardUpdate();
	});
}

listTasklists = function(){
	jsData.tasklists = [];
	gapi_client.tasksApi.listTasklists(null, function(tasklists){

		console.log('listTasklists', tasklists);
		jsData.tasklists = tasklists;
		getTasks(tasklists);
		//console.log('tasklists', jsData.tasklists);
	});
}

getTasks = function(tasklists){
	gapi_client.tasksApi.getTasks(tasklists, null, function(){
		sorting(jsData);
		jsData.$apply();
		jsData.dashboardUpdate();
	});
}

//out of gapi

function findIndex(array, json_key, key_value){
	if(!array || !key_value) return null;
	var temp1 = key_value;
	if(typeof(temp1) == 'string') temp1 = temp1.toUpperCase();
	for(var i = 0; i < array.length; i++){
		var temp2 = array[i][json_key];
		if(typeof(array[i][json_key]) == 'string') temp2 = temp2.toUpperCase();
		if(temp1 == temp2){
			return i;
		}
	}
	return null;
}

function getDataFromKeyValue(array, json_key, key_value){
	if(!array || !key_value) return null;
	return array[findIndex(array, json_key, key_value)];
}

function innerJoin(old_array, new_array, json_key){
	if(!new_array) return old_array;
	if(!old_array) return new_array;

	new_array.forEach(function(new_data, i){
    //keep the orginal list. extend new data or add new data to list
    var old_data = getDataFromKeyValue(old_array, json_key, new_data[json_key]);
    if(old_data != null){
    	$.extend(old_data, new_data);
    }else{
    	old_array[old_array.length] = new_data;
    }
});
	for(var i = old_array.length-1; i > 0; i--){
		if(getDataFromKeyValue(new_array, json_key, old_array[i][json_key]) == null){
			old_array.splice(i, 1);
		}
	}
}

function leftJoin(old_array, new_array, json_key){
	if(!new_array) return old_array;
	if(!old_array) old_array = [];

	new_array.forEach(function(new_data, i){
    //keep the orginal list. extend new data or add new data to list
    var old_data = getDataFromKeyValue(old_array, json_key, new_data[json_key]);
    if(old_data != null){
    	$.extend(old_data, new_data);
    }else{
    	old_array[old_array.length] = new_data;
    }
});
}

function sorting(jsData){
	sortedList = {
		'Within 1 day' : [],
		'Within 2 days' : [],
		'Within 1 week' : [],
		'Within 1 month' : [],
		'Exceed 1 month' : [],
		'No date' : [],
		'Passed' : [],
	};

	var tasklists = jsData.tasklists;
	var events = jsData.events;

	if( tasklists && tasklists.length > 0){
		for (var i = 0; i < tasklists.length; i++) {

			var tasks = tasklists[i].tasks;
			//console.log(tasks);
			if(tasks && tasks.length > 0){
				for (var j = 0; j < tasks.length; j++) {
					var task = tasks[j];
					task.tasklist = tasklists[i];
					if(!task.due){
						sortedList['No date'].push(task);
					}else{
						task.due = moment(task.due);
						task.dayDiff = task.due - moment();
						sortedList[pharseDayDiff(task.dayDiff)].push(task);
					}
				}
			}
		}
	}
	if(events && events.length > 0){
		for (var i = 0; i < events.length; i++) {
			var event = events[i];
			//event.title = event.summary;
			if(event.start){
				//event.start.dateTime ? event.start = new Date(event.start.dateTime) : 0;
				//event.end.dateTime ? event.end = new Date(event.end.dateTime) : 0;
				//event.start.date ? event.start = new Date(event.start.date) : 0;
				//event.end.date ? event.end = new Date(event.end.date) : 0;
				event.dayDiff = moment(event.start.dateTime) - moment();
				sortedList[pharseDayDiff(event.dayDiff)].push(event);
			}
		}
	}

	jsData.sortedList = sortedList;
}

pharseDayDiff = function(diff){
	//var diff = new Date(datetime)-new Date();
	var dt = 24*3600*1000;
	if(diff < -1){
		return 'Passed';
	}else if(diff/dt < 1){
		return 'Within 1 day';
	}else if(diff/dt < 2){
		return 'Within 2 days';
	}else if(diff/dt < 7){
		return 'Within 1 week';
	}else if(diff/dt < 30){
		return 'Within 1 month';
	}else{
		return 'Exceed 1 day';
	}
	return 'No date';
}

function ISODateString(d){
	function pad(n){return n<10 ? '0'+n : n}
	return d.getUTCFullYear()+'-'
	+ pad(d.getUTCMonth()+1)+'-'
	+ pad(d.getUTCDate())+'T'
	+ pad(d.getUTCHours())+':'
	+ pad(d.getUTCMinutes())+':'
	+ pad(d.getUTCSeconds())+'Z'
}