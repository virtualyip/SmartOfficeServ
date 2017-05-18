<?php 

namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Exceptions\JWTException;
use JWTAuth;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller {

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
		//$this->middleware('jwt.auth', ['except' => ['authenticate']]);
	}

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return Response
	 */
	public function list(Request $request)
	{
        $user = JWTAuth::parseToken()->authenticate();
		
        $limit = $request->input('limit');
		if($limit == null){
			$limit = 30;
		}
		
		$notifications = DB::table('notifications')
        	->select('type', 'message', 'created_by', 'created_at')
			->whereRaw("JSON_CONTAINS(delivered_to, '[\"".$user->email."\"]') OR JSON_CONTAINS(delivered_to, '[\"all\"]')")
			->limit($limit)
			->get();
			
		//$notification = DB::table('notifications')->get();
		return response()->json($notifications, 200);
		//return view('welcome');
	}

	public function index(Request $request){
        $validator = Validator::make($request->all(), [
	        'type' => 'nullable|max:50',
	        'types' => 'nullable|array',
	        'from' => 'nullable|array',
	        'to' => 'nullable|array',
	        'from_to' => 'nullable|array',
	        'message' => 'nullable|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all());
        }
        
        $limit = $request->input('limit');
		if($limit == null){
			$limit = 20;
		}
		
        // if no errors are encountered
        // auth: acc owner, dept head, co owner, super admin
        $user = JWTAuth::parseToken()->authenticate();
        $type = $request->input('type');
        $from = $request->input('from');
        $to = $request->input('to');
        $from_to = $request->input('from_to');
        $message = $request->input('message');
        $page = $request->input('page');
        
        $query = DB::table('notifications');
        if($message != null){
        	$query->select('type', 'message', 'data', 'created_by', 'created_at')->where('message', $message)->whereNotNull('data');
        }else{
        	$query->select('type', 'message', 'created_by', 'created_at');
        }
        if($type != null){
        	$query->where('type', $type);
        }
        if($from != null){
        	$query->whereIn('created_by', $from);
        }
        if($to != null){
	        $whereClause = "JSON_CONTAINS(delivered_to, '[\"all\"]')";
        	for($i = 0; $i < sizeof($to); $i++){
        		$whereClause .= " OR JSON_CONTAINS(delivered_to, '[\"" . $to[$i] . "\"]')";
        	}
        	$query->whereRaw($whereClause);
		}
        if($from_to != null){
    		$whereClause = " created_by = '".$from_to[0][0]."' AND JSON_CONTAINS(delivered_to, '[\"" . $from_to[0][1] . "\"]')";
        	for($i = 1; $i < sizeof($from_to); $i++){
    			$whereClause .= " OR created_by = '".$from_to[$i][0]."' AND JSON_CONTAINS(delivered_to, '[\"" . $from_to[$i][1] . "\"]')";
        	}
        	$query->whereRaw($whereClause);
        }
		
		if($type == null && $from == null && $to == null && $from_to == null){
        	$types = $request->input('types');
        	if($types == null){
        		$types = ['online', 'offline', 'chat', 'action', 'admin', 'task', 'event', 'booking', 'email'];
        	}
			$query->whereIn('type', $types);
			$query->whereRaw("(JSON_CONTAINS(delivered_to, '[\"".$user->email."\"]') OR JSON_CONTAINS(delivered_to, '[\"all\"]'))");
		}
		
		$notifications = $query->where('company_id', $user->company_id)->orderBy('created_at', 'desc')->limit($limit)->get();
		return response()->json($notifications, 200);
	}
	
	public function insert(Request $request)
    {
        $validator = Validator::make($request->all(), [
	        'type' => 'required|max:50',
	        'message' => 'required|max:255',
	        'data' => 'nullable',
	        'delivered_to' => 'required|array',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all());
        }
        
        // if no errors are encountered
        // auth: co owner, super admin
        // limitation: check the asset owner
        $user = JWTAuth::parseToken()->authenticate();
        $message = $request->input('message');
        
        // ignore if duplication notification with 3 mins
        $date = date('Y-m-d H:i:s', strtotime("-3 minutes"));
        
        $notification = DB::table('notifications')
        	->where('message', $message)
        	->where('created_at', '>', $date)
        	->first();
        if($notification != null)
        	return response()->json(["error"=>"same notification within 3mins"],200);
        
        DB::table('notifications')->insert([
        	'company_id' => $user->company_id,
        	'type' => $request->input('type'), 
        	'message' => $request->input('message'), 
        	'data' => $request->input('data'), 
        	'created_by' => $user->email, 
        	'delivered_to' => json_encode($request->input('delivered_to')),
        	'created_at' => date('Y-m-d H:i:s'),
        	'notification_id' => uniqid(),
		]);
        return response()->json(array("status"=>200),200);

    }
    
	public function read(Request $request)
	{
        $user = JWTAuth::parseToken()->authenticate();
        
        // if no errors are encountered
        DB::table('users')
        	->where('email', $user->email)
        	->update(['last_read' => date('Y-m-d H:i:s')]);
        	
        return response()->json(array("status"=>200),200);

	}
    
}