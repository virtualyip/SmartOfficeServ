<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/
// auth list:
// 0: all public users
// --- company level ---
// 2: acc owner
// 3: dept head -> mgt data within his dept
// 4: company owner -> mgt data within his company
// --- super level ---
// 5: super admin -> mgt all users
Route::group(['middleware' => ['cors']], function () {
	Route::get('notification', 'NotificationController@index');
	Route::get('notification/read', 'NotificationController@read');
	Route::post('notification/insert', 'NotificationController@insert');
	
	Route::post('user/addUser','UserController@addUser');
	Route::post('user/editUser','UserController@editUser');
	Route::post('user/deleteUser','UserController@deleteUser');
	Route::post('user/signout','UserController@signout');
	Route::post('user/subscribe','UserController@subscribe');
	Route::get('user/profile','UserController@profile');
	Route::get('user/refresh','UserController@refresh');
	Route::get('user/list','UserController@list');
	Route::get('user/refresh','UserController@refresh');
	
	Route::get('map/list','CompanyController@mapList');
	//Route::post('map/update','CompanyController@mapUpdate');
	Route::post('map/markers/insert','CompanyController@mapMarkersInsert');
	Route::post('map/markers/update','CompanyController@mapMarkersUpdate');
	Route::post('map/markers/delete','CompanyController@mapMarkersDelete');
	Route::post('map/markers','CompanyController@mapMarkers');
	
	Route::get('sensor/list','CompanyController@sensorList');
	Route::post('sensor/insert','CompanyController@sensorInsert');
	Route::post('sensor/update','CompanyController@sensorUpdate');
	Route::post('sensor/delete','CompanyController@sensorDelete');
	
	Route::get('asset/list','CompanyController@assetList');
	Route::post('asset/insert','CompanyController@assetInsert');
	Route::post('asset/update','CompanyController@assetUpdate');
	Route::post('asset/delete','CompanyController@assetDelete');
	Route::post('asset/booking/list','CompanyController@assetBookingList');
	Route::post('asset/booking/insert','CompanyController@assetBookingInsert');
	Route::post('asset/booking/update','CompanyController@assetBookingUpdate');
	Route::post('asset/booking/delete','CompanyController@assetBookingDelete');
	
	Route::get('image/{folder}/{filename}', 'ImageController@index');
	Route::post('image/upload', 'ImageController@upload');
	//Route::post('image/submit', 'ImageController@submit');
	Route::post('image/delete', 'ImageController@delete');
	
	Route::get('dashboard', 'HomeController@index');
});
