<?php namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Exceptions\JWTException;
use JWTAuth;
use Illuminate\Support\Facades\DB;

class LoginController extends Controller {

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
		//$this->middleware('auth')->except('login');
		$this->middleware('jwt.auth', ['except' => ['authenticate']]);
	}

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return Response
	 */
	public function index()
	{
		//$notification = DB::table('notification')->whereRaw("JSON_CONTAINS(deliver_to, '[\"yip@yip.com\"]')")->get();
		//$notification = DB::table('notification')->get();
		return response()->json(Controller::getAuthenticatedUser(), 200);
		//return view('welcome');
	}

	public function authenticate(Request $request)
    {
    
        $credentials = $request->only('email', 'password');
        try {
            // verify the credentials and create a token for the user
            if (! $token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'invalid_credentials'], 401);
            }
        } catch (JWTException $e) {
            // something went wrong
            return response()->json(['error' => 'could_not_create_token'], 500);
        }

        // if no errors are encountered we can return a JWT
        DB::table('users')
            ->where('email', $request->input('email'))
            ->update(['jwt_token' => $token]);
            
        return response()->json(compact('token'));

    	//return response()->json("{}");
    }
}
