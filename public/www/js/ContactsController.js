angular.module('starter.controllers').controller('ContactsController', function($scope, ownApi, Upload) {

  $scope.init = function(data){
    jsData.ContactsController = $scope;
    $scope.pagebackseq = [];

    console.log('showing');
    var predefined = {
      form: 'threadlists',
      uesr: null,
    }
    data = $.extend(predefined, data);
    $scope.showForm(data.form);
    $scope.user = data.user;

    //form submit data
    $scope._messages = {};
    $scope._threads = {};
    $scope._compose = {}; 
    //listThreads({maxResults: 30});
  }

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

  //$scope.sortByContact = false;
  //$scope.showRead = true;
  //$scope.threadByContact = [];
  //$scope.pagebackseq = [];


  $scope.showMailBox = function(){
    listThreads({maxResults: 20});
    $scope.showForm('threadlists');
  }

  $scope.showContacts = function(){
    $scope.showForm('userlist');
  }

  $scope.showUser = function(user){
    $scope.user = user;
    $scope.showForm('user');
  }

  $scope.getMessages = function($event, user){
    if(user){
      var email = user.email;
      var q = 'from:('+email+') | to:('+email+') -in:chats';
      gapi_client.gmailApi.listThreads({q:q, maxResults:20}, function(threadlists){
        user.threadlists = threadlists;
        gapi_client.gmailApi.getThread(threadlists, {format:'metadata'}, function(messages){
          user.threadlists[findIndex(threadlists, 'id', messages[0].id)].messages = messages;
          $scope.$apply();
        });
      });
    }else{
      listThreads({maxResults: 30});
    }
  }

  $scope.timeConvert = function(time){
    var timeStamp = new Date(parseInt(time));
    var now = new Date(jsData.now),
    secondsPast = (now.getTime() - timeStamp.getTime()) / 1000;
    if(secondsPast <= 86400){
      hour = timeStamp.getHours();
      minute = timeStamp.getMinutes();
      return hour + ":" + ("0"+minute).substr(1);
    }
    if(secondsPast > 86400){
      day = timeStamp.getDate();
      month = timeStamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ","");
        //year = timeStamp.getFullYear() == now.getFullYear() ? "" :  " "+timeStamp.getFullYear();
        return day + " " + month;
      }
      return moment(timeStamp).format('DD/MM');
    }

    $scope.getHeader = function(headers, key){
     if(headers && headers.length > 0){
      for(var i=0; i<headers.length; i++){
       if(headers[i].name == key){
        return headers[i].value;
      }
    }
  }
  return '';
}

$scope.isSent = function(message){
 for(var i = 0; i < message.labelIds.length; i++){
  if(message.labelIds[i] == 'SENT'){
   return true;
 }
}
return false;
}

$scope.getImg = function(email){
 var user = getDataFromKeyValue($scope.userlist, 'email', email);
 if(user)
  return ownApi.image.get(user.img);
return '../img/user.png';
}

$scope.unescape = function(str){
 return unescape(str);
}

$scope.emailRead = function(threads){
 console.log(threads);
 $scope._threads = threads;
  	//getThread([threads[threads.length-1]], {format: 'full'});
    $scope.showForm('threadRead');
  }

  $scope.emailCompose = function(message, action, to){
  	if(message){
  		if(action=='r'){
        $scope._compose = {
         title: 'Re: '+$scope.getHeader(message.payload.headers, "Subject"),
         to: $scope.getHeader(message.payload.headers, "From"),
         cc: '',
         bcc: '',
         content: '\n\n---------- Reply ----------\n' + message.snippet,
       }
     }else if(action=='ra'){
      $scope._compose = {
       title: 'Re: '+$scope.getHeader(message.payload.headers, "Subject"),
       to: $scope.getHeader(message.payload.headers, "From"),
       cc: 'a',
       bcc: 'b',
       content: '\n\n---------- Reply ----------\n' + message.snippet,
     }
   }else if(action=='fw'){
    $scope._compose = {
     title: 'Fw: '+$scope.getHeader(message.payload.headers, "Subject"),
     to: '',
     cc: '',
     bcc: '',
     content: '\n\n---------- Forword ----------\n' + message.snippet,
   }
 }
}else{
  $scope._compose = {
    to: to,
  };
}
$scope.showForm('messageCompose');
}

$scope.emailComposeSubmit = function($event, compose){
    //$scope.showForm('threadRead');
    //jsData.closeModal();
    $scope.pageback();
  }

  $scope.deleteEmailSubmit = function($event, tasklist){
  }
});
