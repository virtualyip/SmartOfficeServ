<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of the routes that are handled
| by your application. Just tell Laravel the URIs it should respond
| to using a Closure or controller method. Build something great!
|
*/

Route::group(['prefix' => 'api', 'middleware' => ['cors']], function()
{
    //Route::resource('login', 'UserController', ['only' => ['index']]);
    Route::post('login', 'UserController@authenticate');
    Route::post('register/company', 'UserController@registerCompany');
    //Route::post('resigter/user', 'UserController@resigterUser');
	Route::get('test', 'CompanyController@index');
	Route::post('test', 'UserController@index');
	
});

Route::get('/pusher', function() {
    event(new App\Events\PushNotification('Hi there Pusher!'));
    return "Event has been sent!";
});


Route::group(['prefix' => 'api/addu', 'middleware' => ['cors']], function()
{
		Route::get('dashboard', 'HomeController@index');
		
		Route::get('image.php', 'AdduUserController@image');
		
		Route::post('user/get_user_info','AdduUserController@get_user_info');
		Route::post('user/get_user_public_info','AdduUserController@get_user_public_info');
		Route::post('user/get_user_network_summary','AdduUserController@get_user_network_summary');
		Route::post('user/get_user_network_list','AdduUserController@get_user_network_list');
		Route::post('user/get_user_comment_list','AdduUserController@get_user_comment_list');
		Route::post('user/get_user_comment_summary','AdduUserController@get_user_comment_summary');
		Route::post('user/get_table_list_by_user','AdduUserController@get_table_list_by_user');
		Route::post('user/get_table_list_by_created_date','AdduUserController@get_table_list_by_date');
		Route::post('user/get_table_list_by_date','AdduUserController@get_table_list_by_date');
		Route::post('user/get_table_list_by_famous','AdduUserController@get_table_list_by_famous');
		Route::post('user/get_table_list_by_star','AdduUserController@get_table_list_by_star');
		Route::post('user/get_table_list_by_search','AdduUserController@get_table_list_by_search');
		Route::post('user/get_table_list_by_table_owner','AdduUserController@get_table_list_by_table_owner');
		Route::post('user/user_login','AdduUserController@user_login');
		Route::post('user/user_create','AdduUserController@user_create');
		Route::post('user/user_update','AdduUserController@user_update');
		Route::post('user/user_network','AdduUserController@user_network');
		
		Route::post('table/get_table_info','AdduTableController@get_table_info');
		Route::post('table/get_table_involvement_user_list','AdduTableController@get_table_involvement_user_list');
		Route::post('table/table_follow','AdduTableController@table_follow');
		Route::post('table/table_unfollow','AdduTableController@table_unfollow');
		Route::post('table/table_create','AdduTableController@table_create');
		Route::post('table/table_update','AdduTableController@table_update');
		Route::post('table/table_cancel','AdduTableController@table_cancel');
		Route::post('table/table_involve','AdduTableController@table_involve');
		Route::post('table/table_involve_cancel','AdduTableController@table_involve_cancel');
		Route::post('table/table_grouping','AdduTableController@table_grouping');
		Route::post('table/table_ungrouping','AdduTableController@table_ungrouping');
		Route::post('table/table_involve_cancel','AdduTableController@table_involve_cancel');
		Route::post('table/table_involve_reply','AdduTableController@table_involve_reply');
		Route::post('table/table_involve_cancel','AdduTableController@table_involve_cancel');
		
		Route::post('chat_sys/get_chat_msg_by_table','AdduTableController@get_chat_msg_by_table');
		Route::post('chat_sys/chat_new_group_msg','AdduTableController@chat_new_group_msg');
		Route::post('chat_sys/chat_new_table_msg','AdduTableController@chat_new_table_msg');
		Route::post('chat_sys/chat_delete_msg','AdduTableController@chat_delete_msg');

});
