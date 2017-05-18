<?php namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Exceptions\JWTException;
use JWTAuth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller {

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
		//$this->middleware('jwt.auth', ['except' => ['authenticate']]);
	}

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return Response
	 */
	public function index(Request $request)
	{
        require_once __DIR__.'/vendor/autoload.php';
        session_start();

		$client = new Google_Client();
		$client->setAuthConfig(__DIR__.'client_secret.json');
		$client->addScope(Google_Service_Drive::DRIVE_METADATA_READONLY);
		
		if (isset($_SESSION['access_token']) && $_SESSION['access_token']) {
		  $client->setAccessToken($_SESSION['access_token']);
		  $drive_service = new Google_Service_Drive($client);
		  $files_list = $drive_service->files->listFiles(array())->getItems();
		  echo json_encode($files_list);
		} else {
		  $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . '/oauth2callback.php';
		  header('Location: ' . filter_var($redirect_uri, FILTER_SANITIZE_URL));
		}
	}
	
	public function authenticate(Request $request)
    {
        $validator = Validator::make($request->all(), [
	        'email' => 'required|email',
	        'password' => 'required|max:128',
	        'surname' => 'nullable|max:32',
	        'nickname' => 'nullable|max:32',
	        'img' => 'nullable|max:255',
	        'gender' => 'nullable|max:10'
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: acc owner
        $email = $request->input('email');
        $password = $request->input('password');
        $user = DB::table('users')->where('email', $email)->first();
        
        //check if user already exist
		if($user === null){
			//user not exist, then register a new one
			if(!UserController::registerUser($email, $password)){
				return response()->json(['error' => 'internal error'], 500);
			}
	        DB::table('users')
	        	->where('email', $email)
	        	->update([
	        		'surname' => $request->input('surname'),
	        		'nickname' => $request->input('nickname'),
	        		'gender' => $request->input('gender'),
	        	]);
	        	
        	$user = DB::table('users')->where('email', $email)->first();
		}
		
		//check if user's company exist  
		if($user->company_id === null){
			return response()->json(['error' => 1, 'message' => 'user\'s company does not exist'], 406);
		}
		$company = DB::table('companies')->where('company_id', $user->company_id)->first();
		
		// check if user enabled, if not, then assign new password for register company
        $user = DB::table('users')->where('email', $email)->first();
		if($user->enabled == 0){
			if($password != null){
				DB::table('users')->where('email', $email)->update([
	        		'password' => Hash::make($password),
	        	]);
			}
			return response()->json(['error' => 'assigned a company', 'company_id'=>$user->company_id, 'company'=>$company->company], 200);
		}
		
		//temp: for test, should verify google api token in production
		if($password != null){
			DB::table('users')->where('email', $email)->update([
        		'password' => Hash::make($password),
        	]);
		}

		//check user login
        $credentials = array('email'=>$email, 'password'=>$password);//$request->only('email', 'password');
        try {
            // verify the credentials and create a token for the user
            if (! $token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'invalid_credentials'], 401);
            }
        } catch (JWTException $e) {
            // something went wrong
            return response()->json(['error' => 'could_not_create_token'], 500);
        }

		//update user
        DB::table('users')
        	->where('email', $email)
        	->update([
        		'last_active' => date('Y-m-d H:i:s'),
        		'last_login' => date('Y-m-d H:i:s'),
        	]);
		
        // if no errors are encountered we can return a JWT
        return response()->json(['date'=>date('Y-m-d H:i:s'), 'token' => $token, 'company_id'=>$user->company_id, 'company' => $company->company], 200);

    }
    
    public function signout(Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        DB::table('users')
        	->where('email', $user->email)
        	->update([
        		'last_active' => null,
        	]);
        return response()->json(['status'=>200], 200);
    }
    
    public function refresh(Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $token = JWTAuth::getToken();
	    if(!$token){
	        throw new BadRequestHtttpException('Token not provided');
	    }
        try{
	        $token = JWTAuth::refresh($token);
	    }catch(TokenInvalidException $e){
	        throw new AccessDeniedHttpException('The token is invalid');
	    }
        DB::table('users')
        	->where('email', $user->email)
        	->update([
        		'last_active' => date('Y-m-d H:i:s'),
        	]);
        return response()->json(['date'=>date('Y-m-d H:i:s'), 'token' => $token], 200);
    }
    
    public function registerUser($email, $password){
		
		//new user
        $user_id = uniqid();
        
        DB::table('users')->insert([
        	'user_id' => $user_id, 
        	'email' => $email, 
        	'password' =>  Hash::make($password), 
        	'api_token' => Hash::make('token'),
        	'created_at' => date('Y-m-d H:i:s'),
		]);
			
		return true;
    }
    
    public function registerCompany(Request $request)
    {
        $validator = Validator::make($request->all(), [
	        'email' => 'required|email',
	        'password' => 'required|max:128',
	        'company_id' => 'nullable|max:32',
	        'company' => 'required_if:company_id,null|max:128',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
		//check user login
        // auth: acc owner
        $email = $request->input('email');
        $password = $request->input('password');
        
        $credentials = array('email'=>$email, 'password'=>$password);
        try {
            // verify the credentials and create a token for the user
            if (! $token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'invalid_credentials'], 401);
            }
        } catch (JWTException $e) {
            // something went wrong
            return response()->json(['error' => 'could_not_create_token'], 500);
        }
		
        $company_id = $request->input('company_id');
		if($company_id == null){
		
			//new company
	        $company_id = uniqid();
	        $company = $request->input('company');
	        
	        DB::table('companies')->insert([
	        	'company_id' => $company_id,
	        	'company' =>  $company, 
	        	'created_at' => date('Y-m-d H:i:s'),
	        	'created_by' => $email,
			]);
			 
		}
		
		// enable acc if user already registered company
        DB::table('users')
        	->where('email', $email)
        	->update([
	        	'company_id' => $company_id, 
	        	'enabled' => 1
	        ]);
	        
        // if no errors are encountered we can return a JWT
        return response()->json(compact('token'));
    }
    
    public function addUser(Request $request){
        $validator = Validator::make($request->all(), [
	        'email' => 'required|email'
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, company owner, super admin
        $email = $request->input('email');
        $user = JWTAuth::parseToken()->authenticate();
        
        //check if user already exist
		if(DB::table('users')->where('email', $email)->first() === null){
			//user not exist, then add a new one
	        DB::table('users')->insert([
	        		'user_id' => uniqid(),
	        		'email' => $email,
	        		'password' => Hash::make("12345"),
	        		'company_id' => $user->company_id,
	        		'api_token' => Hash::make("12345"),
	        		'enabled' => 0,
        			'created_at' => date('Y-m-d H:i:s'),
	        	]);
            return response()->json(['user' => $email], 200);
		}
		
		//check if assigned company acc
		if(DB::table('users')->where('email', $email)->whereNull('company_id')->count() > 0){
	        //assign user company acc
	        DB::table('users')
	        	->where('email', $email)
	        	->update([
	        		'company_id' => $user->company_id,
	        		'enabled' => 0,
        			'created_at' => date('Y-m-d H:i:s'),
	        	]);
            return response()->json(['user' => $email], 200);
		}
		
        return response()->json(['error' => 'user_alreay_exist'], 400);
    }
    
    public function editUser(Request $request){
        $validator = Validator::make($request->all(), [
        	'email' => 'required|email',
	        'employee_id' => 'nullable|max:32',
	        'surname' => 'nullable|max:32',
	        'nickname' => 'nullable|max:32',
	        'gender' => 'nullable|max:10',
	        'department' => 'nullable|max:32',
	        'title' => 'nullable|max:32',
	        'location' => 'nullable|max:32',
	        'phone' => 'nullable|max:32'
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: acc owner, dept head, company owner, super admin
        $user = JWTAuth::parseToken()->authenticate();
        $email = $request->input('email');
        
        if($user->email == $email || DB::table('companies')->where('created_by', $user->email)->count() > 0 ){
        	
        	$update_array = [];
        	$request->input('employee_id') == null ? '' : $update_array["employee_id"] = $request->input('employee_id');
        	$request->input('surname') == null ? '' : $update_array["surname"] = $request->input('surname');
        	$request->input('nickname') == null ? '' : $update_array["nickname"] = $request->input('nickname');
        	$request->input('gender') == null ? '' : $update_array["gender"] = $request->input('gender');
        	$request->input('department') == null ? '' : $update_array["department"] = $request->input('department');
        	$request->input('title') == null ? '' : $update_array["title"] = $request->input('title');
        	$request->input('location') == null ? '' : $update_array["location"] = $request->input('location');
        	$request->input('phone') == null ? '' : $update_array["phone"] = $request->input('phone');
        	$update_array["created_at"] = date('Y-m-d H:i:s');
        	
        	//update user info
	        DB::table('users')->where('email', $email)->update($update_array);
            return response()->json(['user' => $email], 200);
			
        }
        
    	return response()->json(["error"=>"unauthorized"], 401);
    }
    
    public function deleteUser(Request $request){
        $validator = Validator::make($request->all(), [
        	'email' => 'required|email',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: acc owner, dept head, company owner, super admin
        $user = JWTAuth::parseToken()->authenticate();
        $email = $request->input('email');
        
        if($user->email == $email || DB::table('companies')->where('created_by', $user->email)->count() > 0 ){
        	
	        //clear user company acc info
	        DB::table('users')
	        	->where('email', $email)
	        	->update([
	        		'company_id' => null,
	        		'employee_id' => null,
	        		'department' => null,
	        		'surname' => null,
	        		'nickname' => null,
	        		'gender' => null,
	        		'title' => null,
	        		'location' => null,
	        		'phone' => null,
	        		'img' => null,
	        		'enabled' => 0,
        			'created_at' => date('Y-m-d H:i:s'),
	        	]);
	        	
	        //should also delete map marker
	        DB::table('markers')
	        	->where('type', 'human')
	        	->where('type_id', $user->user_id)
	        	->delete();
	        
            return response()->json(['status' => 200], 200);
        }
        
    	return response()->json(["error"=>"unauthorized"], 401);
    }
    
    public function profile(Request $request)
    {
        // auth: acc owner
        $user = JWTAuth::parseToken()->authenticate();
		$profile = DB::table('users')
			->select('users.user_id','users.email as email','surname','nickname','gender','companies.company_id','companies.company',
				'companies.phone', 'companies.created_by as master', 'users.department','users.title',
				'users.location','users.phone','users.img','users.subscribe','last_active','last_read','last_login')
			->leftJoin('companies', 'users.company_id', '=', 'companies.company_id')
        	->where('email', $user->email)
        	->first();
        	
    	$profile->subscribe = json_decode($profile->subscribe, true);
    	if($profile->email == $profile->master)
    		$profile->role = 'admin';
    	return response()->json($profile);
    }
    
    public function get(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'email' => 'required|email',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: all company users
        $user = JWTAuth::parseToken()->authenticate();
		$profile = DB::table('users')
			->select('user_id','email','surname','nickname','gender','companies.company_id','companies.company',
				'companies.phone', 'department','title',
				'location','phone','img','map_location','devices','last_active','last_read', 'last_login')
			->leftJoin('companies', 'users.company_id', '=', 'companies.company_id')
        	->where('users.company_id', $user->company_id)
        	->where('email', $request->input('email'))
        	->first();
        	
    	return response()->json($profile);
    }
    
    public function list(Request $request)
    {
        $limit = $request->input('limit');
		if($limit == null){
			$limit = 30;
		}
		
        // auth: all company users
        $user = JWTAuth::parseToken()->authenticate();
        
		$list = DB::table('users') 
			->select('user_id','email','surname','nickname','employee_id','gender','company_id','department','title',
				'location','phone','img','last_active')
			->where('company_id', $user->company_id)
			->where('delete_flag', 0)
			->limit($limit)
			->get();
        	
    	return response()->json($list);
    }
    
    public function subscribe(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'marker_id' => 'required|max:32',
        	'action' => 'required|in:add,delete',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: acc owner
        $user = JWTAuth::parseToken()->authenticate();
        $marker_id = $request->input('marker_id');
        $subscribe = [];
        if($user->subscribe !== null){
        	$subscribe = json_decode($user->subscribe, true);
        }
        
        $key = array_search($marker_id, $subscribe);
        if($request->input('action') == 'add'){
	        if($key === false) {
        		array_push($subscribe, $marker_id);
        	}
        }else{
	        if($key !== false) {
			    unset($subscribe[$key]);
			}
        }
        
        $subscribe = array_values($subscribe);
		DB::table('users')
			->where('user_id', $user->user_id)
			->update([
				'subscribe' => json_encode($subscribe)
			]);
        	
    	return response()->json(['status' => 'ok'], 200);
    }
    
}
