angular.module('starter.controllers').controller('UsersController', function($scope, ownApi) {

  $scope.init = function(data){
    jsData.UsersController = $scope;
    $scope.pagebackseq = [];

    console.log('showing');
    var predefined = {
      form: 'form_addUser',
      uesr: {},
      _form: {},
    }
    data = $.extend(predefined, data);
    $scope.showForm(data.form);
    $scope.user = data.user;
    $scope._form = data._form;

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

  $scope.openMap = function($event, map){
  }

  /*
  $scope.showUser = function(){
    $scope.showModal('#usersManageModal');
    $scope.showForm('form_addUser');
  }
  */

  $scope.editUser = function(user){
    $scope.showForm('form_editUser');
    $scope._form = user;
    //$scope.profile.marker = user.markers[0];
    //$scope.updateMarker();
    //$scope.pagebackseq.unshift('form_addUser');
  }

  $scope.addUserSubmit = function($event){
    if($scope._form.new_email){
      $event.target.disabled = true;
      ownApi.user.add({
        email: $scope._form.new_email
      }).done(function(data){
        $scope._form = {};
        jsData.getUserList();
        $event.target.disabled = false;

        socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'added new user: '+$scope._form.new_email});
      }).fail(function(data) {
        console.log(data);  
        $event.target.disabled = false;
      });
    }
  }

  $scope.editUserSubmit = function($event, user){
    console.log(user);
    $event.target.disabled = true;
    ownApi.user.edit({
      email:user.email,
      nickname:user.nickname,
      surname:user.surname,
      employee_id:user.employee_id,
      gender:user.gender,
      department:user.department,
      title:user.title,
      location:user.location,
      phone:user.phone,
    }).done(function(data){
      //console.log(data);
      $scope._form = {};
      jsData.getUserList();
      $scope.pageback();
      $event.target.disabled = false;

      socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'edited user: '+user.email});
    });
  }

  $scope.deleteUserSubmit = function($event, user){
    $event.target.disabled = true;
    ownApi.user.delete({
      email:user.email,
    }).done(function(data){
      //console.log(data);
      $scope._form = {};
      jsData.getUserList();
      $scope.pageback();
      $event.target.disabled = false;

      socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'deleted user: '+user.email});
    });
  }
});