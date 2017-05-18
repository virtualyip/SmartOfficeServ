<?php namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class AdduTableController extends Controller {

	public function __construct()
	{
	}

	public function index(Request $request)
	{
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
	
    public function get_table_info(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'user_id' => 'required|max:255',
        	'token' => 'required|max:255',
        	'table_id' => 'required|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        $user_id = $request->input('user_id');
	    if ($user_info->user_id != $user_id) {
            return response()->json(['retcode' => 1, 'msg_id' => 0, 'error' => 'invalid user'], 200);
        }
        
        // if no errors are encountered
    	$table_id = $request->input('table_id');
        $table_info = DB::table('table_info')
        	->select('table_info.table_id','table_info.user_id','table_title','table_content',
        		'table_content2','table_region','table_district','table_address',
        		'address_public','table_date','table_time','table_time_lastfor',
        		'table_apply_deadline_days','table_apply_deadline','leader_cnt',
        		'invite_cnt','private','user_id_required','sex_include',
        		'age_include','native_include','table_created_date', 
        		'user_info.nickname',
        		'table_involvement.follow_date', 'table_involvement.unfollow_date')
    		->leftJoin('user_info', 'table_info.user_id', '=', 'user_info.user_id')
    		->leftJoin('table_involvement', 'table_info.table_id', '=', 'table_involvement.table_id')
			->where([['table_info.table_id', $table_id], ['involve_sender_id', $user_info->user_id]])
    		->orWhere([['table_info.table_id', $table_id], ['involve_receiver_id', $user_info->user_id]])
			->first();
		
        if($table_info){
        	return response()->json(['retcode' => 0, 'table_info' => $table_info], 200);
    	}else{
    		return response()->json(['retcode' => 1, 'error' => 'invalid request'], 200); 
		}
    }
    
    public function get_chat_msg_by_table(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'user_id' => 'required|max:255',
        	'token' => 'required|max:255',
        	'table_id' => 'required|max:255',
        	'upper_id' => 'nullable|max:255',
        	'lower_id' => 'nullable|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        $user_id = $request->input('user_id');
	    if ($user_info->user_id != $user_id) {
            return response()->json(['retcode' => 1, 'msg_id' => 0, 'error' => 'invalid user'], 200);
        }
        
        // if no errors are encountered
    	$table_id = $request->input('table_id');
    	$upper_id = $request->input('upper_id');
    	$lower_id = $request->input('lower_id');
    	if($upper_id == null) $upper_id = 999999;
    	if($lower_id == null) $lower_id = 0;
    	
        $chat_info = DB::table('chat')
        	->select('chat_id', 'chat_from','chat_to','restricted','chat_date','chat_content','chat.del_flag', 'user_info.nickname')
    		->leftJoin('user_info', 'chat.chat_from', '=', 'user_info.user_id')
			->where('chat_to', $table_id)
			->where('chat.del_flag', 0)
			->where('chat_id','>=', $lower_id)
			->where('chat_id','<=', $upper_id)
			->get();
		
        if($chat_info){
        	return response()->json(['retcode' => 0, 'chat_info' => $chat_info], 200);
    	}else{
    		return response()->json(['retcode' => 1, 'error' => 'invalid request'], 200); 
		}
    }
    
    public function get_table_involvement_user_list(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'user_id' => 'required|max:255',
        	'token' => 'required|max:255',
        	'table_id' => 'required|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        $user_id = $request->input('user_id');
	    if ($user_info->user_id != $user_id) {
            return response()->json(['retcode' => 1, 'msg_id' => 0, 'error' => 'invalid user'], 200);
        }
        
        // if no errors are encountered
    	$table_id = $request->input('table_id');
        $involvement_user_list = DB::table('table_involvement')
        	->select('table_id','involve_sender_id','involve_receiver_id','follow_date',
        		'unfollow_date','involve_type','involve_member_cnt','involve_date',
        		'involve_reply_deadline','involve_replied_status','involve_withdrawn_date',
        		'user_info.nickname')
        	->leftJoin('user_info', 'table_involvement.involve_sender_id', '=', 'user_info.user_id')
			->where('table_id', $table_id)
			->get();
			//left join user_info
		
        if($involvement_user_list){
        	return response()->json(['retcode' => 0, 'involvement_user_list' => $involvement_user_list], 200);
    	}else{
    		return response()->json(['retcode' => 1, 'error' => 'invalid request'], 200); 
		}
    }
    
    public function table_unfollow(Request $request) { return $this->table_follow($request, false); }
    public function table_follow(Request $request, $isFollow = true)
    {
        $validator = Validator::make($request->all(), [
        	'user_id' => 'required|max:255',
        	'token' => 'required|max:255',
        	'table_id' => 'required|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        $user_id = $request->input('user_id');
	    if ($user_info->user_id != $user_id) {
            return response()->json(['retcode' => 1, 'msg_id' => 0, 'error' => 'invalid user'], 200);
        }
        
        // if no errors are encountered
    	$table_id = $request->input('table_id');
        $table_involvement = DB::table('table_involvement')
			->where('table_id', $table_id)
			->where('involve_sender_id', $user_id)
			->get();
			//left join user_info
		
		$follow_date = date('d/m/Y H:i:s');
		$unfollow_date = date('d/m/Y H:i:s');
		$isFollow ? $unfollow_date = null : $follow_date = null;
		
        if($table_involvement){
        	DB::table('table_involvement')
			->where('table_id', $table_id)
			->where('involve_sender_id', $user_id)
			->update([
        		'follow_date' => $follow_date,
        		'unfollow_date' => $unfollow_date
        	]);
        	return response()->json(['retcode' => 0], 200);
    	}else{
        	$table_involvement->insert([
        		'table_id' => $table_id,
        		'involve_sender_id' => $user_id,
        		'follow_date' => $follow_date,
        		'unfollow_date' => $unfollow_date
        	]);
        	return response()->json(['retcode' => 0], 200);
		}
    }
    
    public function table_create(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'user_id' => 'required|max:32',
        	'token' => 'required|max:255',
        	'table_region' => 'required|max:20',
        	'table_district' => 'required|max:20',
        	'table_address' => 'nullable|max:20',
        	'table_title' => 'required|max:255',
        	'table_content' => 'nullable|max:255',
        	'table_content2' => 'nullable|max:255',
        	'table_date' => 'required|max:32',
        	'table_time' => 'required|max:32',
        	'table_time_lastfor' => 'nullable|max:20',
        	'table_apply_deadline' => 'nullable|max:32',
        	'table_apply_deadline_days' => 'nullable|max:999',
        	'private' => 'required|max:1',
        	'address_public' => 'required|max:1',
        	'leader_cnt' => 'nullable|max:99',
        	'invite_cnt' => 'nullable|max:99',
        	'table_drink' => 'nullable|max:1',
        	'user_id_required' => 'nullable|max:1',
        	'user_lv_include' => 'nullable|max:9999',
        	'points_include' => 'nullable|max:9999',
        	'likes_include' => 'nullable|max:9999',
        	'dislike_exclude' => 'nullable|max:9999',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        $user_id = $request->input('user_id');
	    if ($user_info->user_id != $user_id) {
            return response()->json(['retcode' => 1, 'msg_id' => 0, 'error' => 'invalid user'], 200);
        }
		
        // if no errors are encountered
		$table_id = uniqid();
        DB::table('table_info')->insert([
        	'table_id' => $table_id,
        	'user_id' => $request->input('user_id'),
        	'table_region' => $request->input('table_region'),
        	'table_district' =>  $request->input('table_district'),
        	'table_address' =>  $request->input('table_address'),
        	'table_title' =>  $request->input('table_title'),
        	'table_content' =>  $request->input('table_content'),
        	'table_content2' =>  $request->input('table_content2'),
        	'table_date' =>  $request->input('table_date'),
        	'table_time' =>  $request->input('table_time'),
        	'table_time_lastfor' =>  $request->input('table_time_lastfor'),
        	'table_apply_deadline' => $request->input('table_apply_deadline'),
        	'table_apply_deadline_days' =>  $request->input('table_apply_deadline_days'),
        	'private' =>  $request->input('private'),
        	'address_public' =>  $request->input('address_public'),
        	'leader_cnt' =>  $request->input('leader_cnt'),
        	'invite_cnt' =>  $request->input('invite_cnt'),
        	'table_drink' =>  $request->input('table_drink'),
        	'user_id_required' =>  $request->input('user_id_required'),
        	'user_lv_include' =>  $request->input('user_lv_include'),
        	'points_include' =>  $request->input('points_include'),
        	'likes_include' =>  $request->input('likes_include'),
        	'dislike_exclude' =>  $request->input('dislike_exclude'),
			'table_created_date' => date('d/m/Y H:i:s'),
    	]);
    	return response()->json(['retcode' => 0, 'table_id' => $table_id], 200);
    }
    
    public function table_update(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'user_id' => 'required|max:32',
        	'table_id' => 'required|max:32',
        	'token' => 'required|max:255',
        	'table_icon' => 'nullable',
        	'table_region' => 'required|max:20',
        	'table_district' => 'required|max:20',
        	'table_address' => 'nullable|max:20',
        	'table_title' => 'required|max:255',
        	'table_content' => 'nullable|max:255',
        	'table_content2' => 'nullable|max:255',
        	'table_date' => 'required|max:32',
        	'table_time' => 'required|max:32',
        	'table_time_lastfor' => 'nullable|max:20',
        	'table_apply_deadline' => 'nullable|max:32',
        	'table_apply_deadline_days' => 'nullable|max:999',
        	'private' => 'required|max:1',
        	'address_public' => 'required|max:1',
        	'leader_cnt' => 'nullable|max:99',
        	'invite_cnt' => 'nullable|max:99',
        	'table_drink' => 'nullable|max:1',
        	'user_id_required' => 'nullable|max:1',
        	'user_lv_include' => 'nullable|max:9999',
        	'points_include' => 'nullable|max:9999',
        	'likes_include' => 'nullable|max:9999',
        	'dislike_exclude' => 'nullable|max:9999',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        $user_id = $request->input('user_id');
	    if ($user_info->user_id != $user_id) {
            return response()->json(['retcode' => 1, 'msg_id' => 0, 'error' => 'invalid user'], 200);
        }
		
        // if no errors are encountered
        if($user_info->user_id == $user_id){
        	$update_array = [];
        	$request->input('table_icon') == null ? '' : $update_array["table_icon"] = $request->input('table_icon');
        	$request->input('table_region') == null ? '' : $update_array["table_region"] = $request->input('table_region');
        	$request->input('table_district') == null ? '' : $update_array["table_district"] = $request->input('table_district');
        	$request->input('table_address') == null ? '' : $update_array["table_address"] = $request->input('table_address');
        	$request->input('table_title') == null ? '' : $update_array["table_title"] = $request->input('table_title');
        	$request->input('table_content') == null ? '' : $update_array["table_content"] = $request->input('table_content');
        	$request->input('table_content2') == null ? '' : $update_array["table_content2"] = $request->input('table_content2');
        	$request->input('table_date') == null ? '' : $update_array["table_date"] = $request->input('table_date');
        	$request->input('table_time') == null ? '' : $update_array["table_time"] = $request->input('table_time');
        	$request->input('table_time_lastfor') == null ? '' : $update_array["table_time_lastfor"] = $request->input('table_time_lastfor');
        	$request->input('table_apply_deadline') == null ? '' : $update_array["table_apply_deadline"] = $request->input('table_apply_deadline');
        	$request->input('table_apply_deadline_days') == null ? '' : $update_array["table_apply_deadline_days"] = $request->input('table_apply_deadline_days');
        	$request->input('private') == null ? '' : $update_array["private"] = $request->input('private');
        	$request->input('address_public') == null ? '' : $update_array["address_public"] = $request->input('address_public');
        	$request->input('leader_cnt') == null ? '' : $update_array["leader_cnt"] = $request->input('leader_cnt');
        	$request->input('invite_cnt') == null ? '' : $update_array["invite_cnt"] = $request->input('invite_cnt');
        	$request->input('table_drink') == null ? '' : $update_array["table_drink"] = $request->input('table_drink');
        	$request->input('user_id_required') == null ? '' : $update_array["user_id_required"] = $request->input('user_id_required');
        	$request->input('user_lv_include') == null ? '' : $update_array["user_lv_include"] = $request->input('user_lv_include');
        	$request->input('points_include') == null ? '' : $update_array["points_include"] = $request->input('points_include');
        	$request->input('likes_include') == null ? '' : $update_array["likes_include"] = $request->input('likes_include');
        	$request->input('dislike_exclude') == null ? '' : $update_array["dislike_exclude"] = $request->input('dislike_exclude');
        	
        	//update user info
	    	$table_id = $request->input('table_id');
	        DB::table('table_info')->where('table_id', $table_id)->where('user_id', $user_id)->update($update_array);
    		return response()->json(['retcode' => 0, 'table_id' => $table_id], 200);
        }
    }
    
    public function table_cancel(Request $request)
    {
    }
    
    public function chat_new_table_msg(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'chat_from' => 'required|max:255',
        	'chat_to' => 'required|max:255',
        	'chat_content' => 'required|max:255',
        	'token' => 'required|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        $user_id = $request->input('chat_from');
	    if ($user_info->user_id != $user_id) {
            return response()->json(['retcode' => 1, 'msg_id' => 0, 'error' => 'invalid user'], 200);
        }
        
        // if no errors are encountered
        DB::table('chat')->insert([
        	'chat_from' => $request->input('chat_from'),
        	'chat_to' => $request->input('chat_to'),
        	'chat_content' => $request->input('chat_content'),
        	'chat_date' => date('Y-m-d H:i:s'),
        ]);
		return response()->json(['retcode' => 0, 'msg_id' => 11], 200);
    }
    
    public function chat_delete_msg(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'chat_from' => 'required|max:255',
        	'chat_id' => 'required|max:255',
        	'token' => 'required|max:255',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json(['retcode' => 1, 'error' => $validator->errors()->all()], 200);
        }
    	$token = $request->input('token');
    	$user_info = $this->get_querier($token);
        
        // if no errors are encountered
        DB::table('chat')
        	->where('chat_id', $request->input('chat_id'))
        	->where('chat_from', $request->input('chat_from'))
        	->update([
        		'del_flag' => 1
        	]);
		return response()->json(['retcode' => 0, 'msg_id' => 11], 200);
    }
}
