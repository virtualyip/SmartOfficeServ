<?php namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class HomeController extends Controller {

	/*
	|--------------------------------------------------------------------------
	| Home Controller
	|--------------------------------------------------------------------------
	|
	| This controller renders your application's "dashboard" for users that
	| are authenticated. Of course, you are free to change or remove the
	| controller as you wish. It is just here to get your app started!
	|
	*/

	/**
	 * Create a new controller instance.
	 *
	 * @return void
	 */
	public function __construct()
	{
		//$this->middleware('auth');
		$this->middleware('jwt.auth');
	}

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return Response
	 */
	public function index()
	{
		//return view('home', ['email'=>Auth::user()->email]);
		
    	$tasks_list = array(
        		array("id"=>1,"title"=>"test", "desc"=>"go home", "deadline"=>"---", "process"=>100, "remark"=>"", "img"=>"_"),
        		array("id"=>2,"title"=>"1234", "desc"=>"go play", "deadline"=>"---", "process"=>50, "remark"=>"", "img"=>"_"),
			);
		
		$users_list = array(
				array("id"=>1,"nickname"=>"sam wong","department"=>"Marketing","title"=>"clerk","email"=>"1@ds.com","contact"=>"1234","img"=>"_"),
				array("id"=>2,"nickname"=>"may fong","department"=>"Admin","title"=>"Boss","email"=>"2@ds.com","contact"=>"1234","img"=>"_"),
			);
			
		$events_list = array(
				array("id"=>1,"title"=>"shopping", "desc"=>"hi123213", "location"=>"Room102", "start"=>"2016-12-01 11:00", "end"=>"2016-12-01 12:00", "img"=>"_", "icon"=>"fa-credit-card"),
				array("id"=>2,"title"=>"hiking", "desc"=>"asfdsafdsaf", "location"=>"Room302", "start"=>"2016-12-02 11:00", "end"=>"2016-12-02 12:00", "img"=>"_", "icon"=>"fa-credit-card"),
			);
		
		$notifications_list = array(
				array("id"=>1, "time"=>123, "type"=>"fa-comment", "content"=>"new task", "url"=>"_"),
				array("id"=>2, "time"=>1234, "type"=>"fa-comment", "content"=>"new task", "url"=>"_")
			);
			
		$dashboard = array(
				"updated"=>140213, 
				"sensor" => array("temperature"=>23.1,"l"=>123),
				"tasks_list" => $tasks_list,
				"users_list" => $users_list,
				"events_list" => $events_list,
				"notifications_list" => $notifications_list
			);
			
		return response()->json($dashboard);
	}

	public function data()
	{
		return "{none}";
	}
}
