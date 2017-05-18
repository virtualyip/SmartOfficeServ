angular.module('starter.controllers').controller('MapMarkerController', function($scope, ownApi) {
	
	$scope.init = function(data){
		jsData.MapMarkerController = $scope;
		$scope.pagebackseq = [];
		$scope.title = "Map Marker";
		$scope.mapMarker = "";
		if(data.form)
			$scope.showForm(data.form);
		else
			$scope.showForm("mapMarker");

		$scope._mapMarker = {};
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

	//addMarker
	$scope.openMap = function($event, map){
		offset = {x : $event.offsetX, y : $event.offsetY}; 
		offsetSize = {x : $event.target.offsetWidth, y : $event.target.offsetHeight};

		$scope._mapMarker.map = map;
		$scope._mapMarker.offset = offset;
		$scope._mapMarker.offsetSize = offsetSize;
		$scope._mapMarker.offsetRatio = {x : offset.x / offsetSize.x, y : offset.y / offsetSize.y};
		$scope._mapMarker.size = 300;
		$scope._mapMarker.style = {
			'width':$scope._mapMarker.offsetSize.x+'px', 
			'height':$scope._mapMarker.offsetSize.y+'px', 
			'margin-left': -$scope._mapMarker.offset.x+$scope._mapMarker.size/2+'px', 
			'margin-top': -$scope._mapMarker.offset.y+$scope._mapMarker.size/2+'px'	
		};
		//console.log(offratio);
		if(!$scope._mapMarker.type){
			$scope.mapMarkerTypeChange('human');
		}
		$scope.showForm('addMapMarker');
	}

	$scope.deleteMap = function(i){
		ownApi.image.delete({
			type: 'maps',
			type_id: i,
		}).then(function (resp) {
			$scope.getMap();
		});
	}

	$scope.mapMarkerTypeChange = function(type){
		$scope._mapMarker.type = type;
		$scope._mapMarker.belong = {};

		if(type == 'human'){
			$scope._mapMarker.list = jsData.userlist;
			for(var i = 0; i < $scope._mapMarker.list.length; i++){
				var item = $scope._mapMarker.list[i];
				item.id = item.user_id;
				item.name = item.email + '('+item.nickname + ' ' + item.surname +')';
			}
		}
		if(type == 'sensor'){
			$scope._mapMarker.list = jsData.sensorlist;
			for(var i = 0; i < $scope._mapMarker.list.length; i++){
				var item = $scope._mapMarker.list[i];
				item.id = item.sensor_id;
			}
		}
		if(type == 'asset'){
			$scope._mapMarker.list = jsData.assetlist;
			for(var i = 0; i < $scope._mapMarker.list.length; i++){
				var item = $scope._mapMarker.list[i];
				item.id = item.asset_id;
			}
		}
	}

	$scope.mapMarkerBelongChange = function(item){
		$scope._mapMarker.belong = item;
	}

	$scope.addMapMarker = function(type, marker){
		/*
		if(type == 'human'){
			jsData.showModal('#usersManageModal');
			jsData.UsersController._form = getDataFromKeyValue(jsData.userlist, 'user_id', marker.type_id);
			jsData.UsersController._form.marker = marker;
			jsData.UsersController.showForm('form_editUser');
			if(marker == null)
			  jsData.UsersController.showForm('form_addUser');
		}
		if(type == 'sensor'){
			jsData.showModal('#sensorsManageModal');
			jsData.SensorsController._form = getDataFromKeyValue(jsData.sensorlist, 'sensor_id', marker.type_id);
			jsData.SensorsController._form.marker = marker;
			jsData.SensorsController.showForm('form_editSensor');
			if(marker == null)
			  jsData.SensorsController.showForm('form_addSensor');
		}
		if(type == 'asset'){
			jsData.showModal('#assetsManageModal');
			jsData.AssetsController._form = getDataFromKeyValue(jsData.assetlist, 'asset_id', marker.type_id);
			jsData.AssetsController._form.marker = marker;
			jsData.AssetsController.showForm('form_editAsset');
			if(marker == null)
			  jsData.AssetsController.showForm('form_addAsset');
		}
		*/
	}

	$scope.editMapMarker = function(map, marker){
		//jsData.editMapMarker(map, marker);
		$scope._mapMarker = marker;
		$scope._mapMarker.map = map;
		$scope.mapMarkerTypeChange(marker.type);
		$scope._mapMarker.belong = getDataFromKeyValue($scope._mapMarker.list, 'id', marker.type_id);
		$scope.showForm('editMapMarker');
	}

	$scope.onStartDrag = function(map, marker){
		console.log('marker', marker);
		$scope.drag = marker;
		$scope.drag.map = map;
		$scope.mapMarkerTypeChange(marker.type);
		$scope.drag.belong = getDataFromKeyValue($scope._mapMarker.list, 'id', marker.type_id);
	}

	$scope.onDrag = function($event){
		if($scope.drag){
			console.log('onDrag');
		}
	}

	$scope.onDrop = function($event){
		if(!$event) {
			console.log('marker drop failed');
			$scope.drag = null;
			return;
		}
		offset = {x : $event.offsetX, y : $event.offsetY}; 
		offsetSize = {x : $event.target.offsetWidth, y : $event.target.offsetHeight};
		offsetRatio = {x : offset.x / offsetSize.x, y : offset.y / offsetSize.y};
		$scope.drag.px = offsetRatio.x;
		$scope.drag.py = offsetRatio.y;
		console.log('marker dropped', $scope.drag);
		//$scope.editMapMarker($scope.drag.map, $scope.drag);
		$scope.showForm('editMapMarker');
		$scope.editMapMarkerSubmit($event, $scope.drag);
	}


	$scope.addMapMarkerSubmit = function($event, marker){
		$event.target.disabled = true;
		ownApi.map.markers.add({
			type: marker.type,
			map_id: marker.map.map_id,
			belong: marker.belong.id,
			px: marker.offsetRatio.x,
			py: marker.offsetRatio.y,
			for: marker.forlist,
				remarks: marker.remarks,
		}).done(function(data){
			console.log(data);
			$event.target.disabled = false;
			$scope.pageback();
			$scope._mapMarker = {};
			jsData.getMaps();

			socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'added new marker: '+marker.type+" on map#"+marker.map.i});
		}).fail(function(data){
			console.log(data);
			$event.target.disabled = false;
		});
	}

	$scope.editMapMarkerSubmit = function($event, marker){
		$event.target.disabled = true;
		ownApi.map.markers.update({
			marker_id: marker.marker_id,
			type: marker.type,
			map_id: marker.map.map_id,
			belong: marker.belong.id,
			px: marker.px,
			py: marker.py,
			for: marker.forlist,
				remarks: marker.remarks,
		}).done(function(data){
			console.log(data);
			$event.target.disabled = false;
			$scope.pageback();
			$scope._mapMarker = {};
			jsData.getMaps();
			$scope.drag = null;

			socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'edited marker: '+marker.name+" on map#"+marker.map.i});
		}).fail(function(data){
			console.log(data);
			$event.target.disabled = false;
		});
	}

	$scope.deleteMapMarkerSubmit = function($event, marker){
		$event.target.disabled = true;
		ownApi.map.markers.delete({
			marker_id: marker.marker_id
		}).done(function(data){
			//console.log(data);
			jsData.getMapMarker(jsData.profile.map);
			$scope.pageback();
			$event.target.disabled = false;

			socket_emit('message', {to: [jsData.profile.master], type: 'admin', message:'deleted marker: '+marker.name+" on map#"+marker.map.i});
		});
	}
});
