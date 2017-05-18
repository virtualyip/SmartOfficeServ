<?php namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class AdduUserController extends Controller {

	public function __construct()
	{
	}

	public function index(Request $request)
	{
	}
	
    public function image(Request $request)
    {
        $action = $request->input('request');
        $image_str = null;
        
        if($action == "get_user_icon"){
        	$user_id = $request->input('user_id');
		    $user_info = DB::table('user_info')
			->select('user_icon')
			->where('user_id', $user_id)
			->first();
			
			if($user_info != null && $user_info->user_icon != null){
				$user_info->user_icon = str_replace('data:image/png;base64,','',$user_info->user_icon);
	    		$response = response()->make(base64_decode($user_info->user_icon), 200);
				$response->header("Content-type", "image/png");
	    		return $response;
			}
        }
        if($action == "get_table_icon"){
        	$table_id = $request->input('table_id');
		    $table_info = DB::table('table_info')
			->select('table_icon')
			->where('table_id', $table_id)
			->first();
			
			if($table_info != null && $table_info->table_icon != null){
				$table_info->table_icon = str_replace('data:image/png;base64,','',$table_info->table_icon);
	    		$response = response()->make(base64_decode($table_info->table_icon), 200);
				$response->header("Content-type", "image/png");
	    		return $response;
    		}
        }
        return null;
        
    	/*
	    $path = storage_path() . '/app/assets/7621227463fdf5b8fc9c83a03482ec52.png';

	    if(!File::exists($path)) 
	    	return response()->json("$path file not found", 404);;
	
	    $file = File::get($path);
	    $type = File::mimeType($path);
	
	    $response = response()->make($file, 200);
	    $response->header("Content-Type", $type);
	
	    return $response;
        */
    }
    
    public function get_querier($token){
    	if($token == null) return null;
    	
		$user_info = DB::table('user_info')
			->select('user_id','nickname','sex','age_group','native','self_intro','reg_date','token','token_expiry_date')
			->where('token', $token)
			->first();
			
    	if($user_info) 
    		return $user_info;
    	else
    		return null;
    }
    
    public function user_login(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'login_id' => 'required|max:30',
        	'login_pw' => 'required|max:30',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'msg_id'=>0, 'error' => $validator->errors()->all()], 200);
        }
		
        // if no errors are encountered
        $login_id = $request->input('login_id');
        $login_pw = $request->input('login_pw');
        
        //check user
		$user_info = DB::table('user_info')
        	->where('login_id', $login_id)
        	->where('login_pw', $login_pw)
        	->first();
        if($user_info){
			$token = Hash::make($user_info->user_id);
	        DB::table('user_info')
	        	->where('login_id', $login_id)
	        	->where('login_pw', $login_pw)
	        	->update([
	        		'token' => $token,
	        	]);
	    	return response()->json(['retcode' => 0, 'user' => ['user_id'=>$user_info->user_id,'token'=>$token]], 200);
    	}else{
        	return response()->json(['retcode' => 1, 'msg_id'=>2, 'error' => 'invalid user'], 200);
    	}
    }
    
    public function user_create(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'nickname' => 'required|max:20',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
		
        // if no errors are encountered
        $nickname = $request->input('nickname');
        
        //check nickname duplication
		$user = DB::table('user_info')
			->select('nickname')
        	->where('nickname', $nickname)
        	->first();
        if($user){
        	return response()->json(['retcode' => 1, 'error' => 'user already exist'], 200);
    	}
	
		//insert nickname
		$user_id = uniqid();
		$token = Hash::make($user_id);
        DB::table('user_info')->insert([
        		'user_id' => $user_id,
        		'nickname' => $nickname,
        		'login_id' => $user_id,
        		'login_pw' => $user_id,
        		'reg_method' => 'N/A',
    			'reg_date' => date('Y-m-d H:i:s'),
        		'token' => $token,
        	]);
    	return response()->json(['retcode' => 0, 'user' => ['user_id'=>$user_id,'token'=>$token]], 200);
    }
    
    public function user_update(Request $request){
        $validator = Validator::make($request->all(), [
        	'sex' => 'nullable|max:32',
	        'age_group' => 'nullable|max:32',
	        'native' => 'nullable|max:32',
	        'self_intro' => 'nullable|max:255',
	        'user_id' => 'required|max:255',
	        'token' => 'required|max:255',
	        'user_icon' => 'nullable'
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
        
        // if no errors are encountered
    	$user_id = $request->input('user_id');
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        
        if($user_info->user_id == $user_id){
        	
        	$update_array = [];
        	$request->input('sex') == null ? '' : $update_array["sex"] = $request->input('sex');
        	$request->input('age_group') == null ? '' : $update_array["age_group"] = $request->input('age_group');
        	$request->input('native') == null ? '' : $update_array["native"] = $request->input('native');
        	$request->input('self_intro') == null ? '' : $update_array["self_intro"] = $request->input('self_intro');
        	$request->input('user_icon') == null ? '' : $update_array["user_icon"] = $request->input('user_icon');
        	
        	//update user info
	        DB::table('user_info')->where('user_id', $user_id)->update($update_array);
	        
    		$user_info = $this->get_querier($token);
            return response()->json(['retcode' => 0, 'user' => $user_info], 200);
			
        }
        
    	return response()->json(['retcode' => 1, "error"=>"unauthorized"], 401);
    }
    
    public function user_network(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'action' => 'required|max:20',
        	'user_id_from' => 'required|max:32',
        	'user_id_to' => 'required|max:32',
        	'network_type' => 'required|max:20',
        	'querier_id' => 'required|max:32',
        	'token' => 'required|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        $querier_id = $request->input('querier_id');
	    if ($user_info->user_id != $querier_id) {
            return response()->json(['retcode' => 1, 'msg_id' => 0, 'error' => 'invalid user'], 200);
        }
		
        // if no errors are encountered
        
        $action = $request->input('action');
        $user_id_from = $request->input('user_id_from');
        $user_id_to = $request->input('user_id_to');
        $network_type = $request->input('network_type');
        
        if($action == 'add'){
	        DB::table('user_network')->insert([
	        		'user_id_from' => $user_id_from,
	        		'user_id_to' => $user_id_to,
	        		'network_type' => $network_type,
	    			'network_created_date' => date('Y-m-d H:i:s'),
	        	]);
	    	return response()->json(['retcode' => 0], 200);
        }
        if($action == 'remove'){
	        DB::table('user_network')->where([
	        		'user_id_from' => $user_id_from,
	        		'user_id_to' => $user_id_to,
	        		'network_type' => $network_type
	        	])->delete();
	    	return response()->json(['retcode' => 0], 200);
        }
    }
    
    
    public function get_user_network_list(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'p' => 'required|min:0|max:9999',
        	'querier_id' => 'required|max:255',
        	'token' => 'required|max:255',
        	'user_id_to' => 'nullable|max:255',
        	'user_id_from' => 'nullable|max:255',
        	'network_type' => 'required|max:255'
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
        
        // if no errors are encountered
        $p = $request->input('p');
        $limit = 10;
		$offset = $limit * $p;
    	$querier_id = $request->input('querier_id');
    	$user_id_to = $request->input('user_id_to');
    	$user_id_from = $request->input('user_id_from');
    	$network_type = $request->input('network_type');
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
    	
		$user_network_list = DB::table('user_network')
			->select('user_id_from','user_id_to','network_type','network_created_date', 'user_info.nickname')
    		->where('network_type', $network_type);
			
		if($user_id_from != null){
        	$user_network_list = $user_network_list
        		->leftJoin('user_info', 'user_network.user_id_to', '=', 'user_info.user_id')
        		->where('user_id_from', $user_id_from);
		}else if($user_id_to != null){
        	$user_network_list = $user_network_list
        		->leftJoin('user_info', 'user_network.user_id_from', '=', 'user_info.user_id')
        		->where('user_id_to', $user_id_to);
		}
		//left join user_info
        $user_network_list = $user_network_list->offset($offset)->limit($limit)->get();
        	
        $noMoreItemsAvailable = true;
        if(count($user_network_list) == $limit){
        	$noMoreItemsAvailable = false;
        }
        
    	return response()->json(['retcode' => 0, 'noMoreItemsAvailable'=>$noMoreItemsAvailable,'user_network_list'=>$user_network_list], 200);
    }
    
    public function get_user_public_info(Request $request) { return $this->get_user_info($request); }
    public function get_user_info(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'user_id' => 'required|max:255',
        	'token' => 'required|max:255',
        	'qurier_id' => 'nullable|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
        
        // if no errors are encountered
        $user_id = $request->input('user_id');
        $token = $request->input('token');
        $qurier_id = $request->input('qurier_id');
        
        //get user info
        $user_info = DB::table('user_info');
    	$user_info = $user_info->select('user_id','nickname','sex','age_group','native','self_intro','reg_date','token');
		$user_info = $user_info->where('user_id', $user_id);
		$user_info = $user_info->first();
		
		///
        $user_following = DB::table('user_network')->where('user_id_from', $user_id)->where('network_type','follow')->get();
        $user_follower = DB::table('user_network')->where('user_id_to', $user_id)->where('network_type','follow')->get();
        $user_blacklist = DB::table('user_network')->where('user_id_from', $user_id)->where('network_type','blacklist')->get();
        $user_following != null ? $user_info->follow_cnt = count($user_following) : $user_info->follow_cnt = 0;
        $user_follower != null ? $user_info->fans_cnt = count($user_follower) : $user_info->follow_cnt = 0;
        $user_blacklist != null ? $user_info->blacklist = count($user_blacklist) : $user_info->follow_cnt = 0;
       	
        if($user_info){
        	return response()->json(['retcode' => 0, 'user_info' => $user_info], 200);
    	}else{
    		return response()->json(['retcode' => 1, 'error' => 'invalid request'], 200); 
		}
    }
    
    public function get_table_list_by_user(Request $request) { return $this->get_table_list($request, 'user'); }
    public function get_table_list_by_created_date(Request $request) { return $this->get_table_list($request, 'created_date'); }
    public function get_table_list_by_famous(Request $request) { return $this->get_table_list($request, 'famous'); }
    public function get_table_list_by_star(Request $request) { return $this->get_table_list($request, 'star'); }
    public function get_table_list_by_search(Request $request) { return $this->get_table_list($request, 'search'); }
    public function get_table_list_by_date(Request $request) { return $this->get_table_list($request, 'date'); }
    public function get_table_list_by_table_owner(Request $request) { return $this->get_table_list($request, 'table_owner'); }
    
    public function get_table_list(Request $request, String $sorting)
    {
        $validator = Validator::make($request->all(), [
        	'p' => 'required|min:0|max:9999',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
        
        // if no errors are encountered
		
        $p = $request->input('p');
        $limit = 5;
		$offset = $limit * $p;
        $ip = $_SERVER['REMOTE_ADDR'];
        
        /*
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
        */
        $table_info = DB::table('table_info')
        	->select('table_info.table_id', 'table_info.user_id', 'table_title', 'table_content', 'table_content2', 'table_region',
        		'table_district','table_address','address_public','table_date','table_time','table_time_lastfor',
        		'table_apply_deadline_days','table_apply_deadline','leader_cnt','invite_cnt','private',
        		'user_id_required','sex_include','age_include','native_include','table_created_date', 
        		'user_info.nickname')
    		->leftJoin('user_info', 'table_info.user_id', '=', 'user_info.user_id');
        		
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        if($sorting == 'table_owner'){
        	if(!$user_info) response()->json(['retcode' => 1, 'error' => 'invalid user'], 200);
    		$target_id = $request->input('target_id');
        	if($target_id != null)
        		$table_info = $table_info->where('table_info.user_id', $target_id);
        	else
        		$table_info = $table_info->where('table_info.user_id', $user_info->user_id);
    		$table_info = $table_info->orderBy('table_id', 'desc');
        }
        else if($sorting == 'created_date' || $sorting == 'date' || $sorting == 'famous' || $sorting == 'star'){
        	if($user_info){
	        	$table_info = $table_info
	        		->addSelect('table_involvement.follow_date')->addSelect('table_involvement.unfollow_date')
	        		->leftJoin('table_involvement', function ($leftJoin) use ($user_info) {
	        			 $leftJoin->on('table_info.table_id', '=', 'table_involvement.table_id')
	        			 	->where('involve_sender_id', $user_info->user_id);
        			})
	        		->where([['private', 1],
	        			['table_info.user_id', $user_info->user_id]])
	        		->orWhere([['private', 0]]);
        	}else{
	        	$table_info = $table_info->where([['private', '=', 0]]);
    		}
    		    		
    		if($sorting == 'created_date'){
        		$table_info = $table_info->orderBy('table_created_date', 'desc');
    		}
    		if($sorting == 'date' || $sorting == 'famous' || $sorting == 'star'){
        		$table_info = $table_info->orderBy('table_date', 'desc');
    		}
        }
        else if($sorting == 'user'){
        	if(!$user_info) response()->json(['retcode' => 1, 'error' => 'invalid user'], 200);
        	$table_info = $table_info
        		->addSelect('table_involvement.follow_date')->addSelect('table_involvement.unfollow_date')
        		->rightJoin('table_involvement', 'table_info.table_id', '=', 'table_involvement.table_id')
        		->where('involve_sender_id', $user_info->user_id)
        		->whereNotNull('follow_date')
        		->orderBy('table_date', 'desc');
        }
        else{
        	$table_info = $table_info
        		->where('table_info.user_id', 0);
        }
        
        $table_info = $table_info->offset($offset)->limit($limit)->get();
        	
        $noMoreItemsAvailable = true;
        if(count($table_info) == $limit){
        	$noMoreItemsAvailable = false;
        }
        
    	return response()->json(['retcode' => 0, 'noMoreItemsAvailable' => $noMoreItemsAvailable, 'user_table_list' => $table_info], 200);
    }
    
}
