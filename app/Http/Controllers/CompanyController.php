<?php namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Exceptions\JWTException;
use JWTAuth;
use Illuminate\Support\Facades\DB;

class CompanyController extends Controller {

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
	}

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return Response
	 */
	public function index(Request $request)
	{
        return response()->json(["invalid request"], 400);
	}
    
    public function mapList(){
        $user = JWTAuth::parseToken()->authenticate();
        
        $maps = DB::table('maps')
        	->select('maps.map_id', 'maps.img', 'maps.i')
        	->where('maps.company_id', $user->company_id)
        	->get();
        
    	return response()->json($maps);
    }
    
    public function sensorList(){
        $user = JWTAuth::parseToken()->authenticate();
        
        $sensors = DB::table('sensors')
        	->select('sensor_id', 'address', 'name', 'description', 'img')
        	->where('company_id', $user->company_id)
        	->get();
        
    	return response()->json($sensors);
    }
    
    public function assetList(){
        $user = JWTAuth::parseToken()->authenticate();
        
        $assets = DB::table('assets')
        	->select('asset_id', 'type', 'name', 'img')
        	->where('company_id', $user->company_id)
        	->get();
        
    	return response()->json($assets);
    }
    
    public function mapMarkers(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'map_id' => 'required|max:32',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        //$user = JWTAuth::parseToken()->authenticate();
        
        $map_markers = DB::table('map_markers')
        	->select('marker_id', 'type', 'type_id', 'px', 'py', 'remarks')
        	->where('map_id', $request->input('map_id'))
        	->get();
        	
    	return response()->json($map_markers);
    }
    
    public function sensorInsert(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'address' => 'required|max:64',
        	'name' => 'required|max:64',
        	'description' => 'required|max:64',
        	'rssi' => 'nullable|numeric',
        	'status' => 'nullable|max:32',
        	'data' => 'nullable|json',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        $user = JWTAuth::parseToken()->authenticate();
    
        DB::table('sensors')->insert([
        	'sensor_id' => uniqid(), 
        	'address' => $request->input('address'), 
        	'name' => $request->input('name'),
        	'description' => $request->input('description'),
        	'rssi' => $request->input('rssi'),
        	'status' => $request->input('status'),
        	'data' => $request->input('data'),
        	'company_id' => $user->company_id, 
        	'created_by' => $user->email,
        	'created_at' => date('Y-m-d H:i:s'),
		]);
		
		$sensor_id = DB::table('sensors')
			->select('sensor_id')
			->where('address',$request->input('address'))
			->first();
			
    	return response()->json($sensor_id);
    }
    
    public function sensorUpdate(Request $request)
    {
    	$validator = Validator::make($request->all(), [
        	'sensor_id' => 'required|max:64',
        	'address' => 'required|max:64',
        	'name' => 'required|max:64',
        	'description' => 'required|max:64',
        	'rssi' => 'nullable|numeric',
        	'status' => 'nullable|max:32',
        	'data' => 'nullable|json',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, company owner, super admin
        $user = JWTAuth::parseToken()->authenticate();
        $sensor_id = $request->input('sensor_id');
        $address = $request->input('address');
        
        if(DB::table('companies')->where('created_by', $user->email)->count() > 0 ){
        	
        	$update_array = [];
        	$request->input('description') == null ? '' : $update_array["description"] = $request->input('description');
        	$request->input('rssi') == null ? '' : $update_array["rssi"] = $request->input('rssi');
        	$request->input('status') == null ? '' : $update_array["status"] = $request->input('status');
        	$request->input('data') == null ? '' : $update_array["data"] = $request->input('data');
        	$update_array["created_at"] = date('Y-m-d H:i:s');
        	
        	//update user info
	        DB::table('sensors')->where('sensor_id', $sensor_id)->where('address', $address)->update($update_array);
            return response()->json(['status' => 200], 200);
        }
        
    	return response()->json(["error"=>"unauthorized"], 401);
    }
    
    public function sensorDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'sensor_id' => 'required|max:64',
        	'address' => 'required|max:64',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, company owner, super admin
        $user = JWTAuth::parseToken()->authenticate();
        $sensor_id = $request->input('sensor_id');
        $address = $request->input('address');
        
        //if(DB::table('companies')->where('created_by', $user->email)->count() > 0 ){
        	
	        //clear user company acc info
	        DB::table('sensors')
	        	->where('sensor_id', $sensor_id)
	        	->where('address', $address)
	        	->delete();
	        	
	        //should also delete map marker
	        DB::table('map_markers')
	        	->where('type', 'sensor')
	        	->where('type_id', $sensor_id)
	        	->delete();
	        
            return response()->json(['status' => 200], 200);
        //}
        
    	//return response()->json(["error"=>"unauthorized"], 401);
    }
    
    public function assetInsert(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'name' => 'required|max:64',
	        //'type' => 'required|in:human,sensor,asset'
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        $user = JWTAuth::parseToken()->authenticate();
    
        DB::table('assets')->insert([
        	'asset_id' => uniqid(), 
        	//'type' => $request->input('type'), 
        	'name' => $request->input('name'),
        	'company_id' => $user->company_id, 
        	'created_by' => $user->email,
        	'created_at' => date('Y-m-d H:i:s'),
		]);
    	return response()->json(["status"=>200],200);
    }
    
    public function assetUpdate(Request $request)
    {
    	$validator = Validator::make($request->all(), [
        	'asset_id' => 'required|max:64',
        	'name' => 'required|max:64',
        	'type' => 'nullable|max:64',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, company owner, super admin
        $user = JWTAuth::parseToken()->authenticate();
        $asset_id = $request->input('asset_id');
        
        if(DB::table('companies')->where('created_by', $user->email)->count() > 0 ){
        	
        	$update_array = [];
        	$request->input('name') == null ? '' : $update_array["name"] = $request->input('name');
        	$request->input('type') == null ? '' : $update_array["type"] = $request->input('type');
        	$update_array["created_at"] = date('Y-m-d H:i:s');
        	
        	//update user info
	        DB::table('assets')->where('asset_id', $asset_id)->update($update_array);
            return response()->json(['status' => 200], 200);
        }
        
    	return response()->json(["error"=>"unauthorized"], 401);
    }
    
    public function assetDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'asset_id' => 'required|max:64',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, company owner, super admin
        $user = JWTAuth::parseToken()->authenticate();
        $asset_id = $request->input('asset_id');
        
        if(DB::table('companies')->where('created_by', $user->email)->count() > 0 ){
        	
	        //clear user company acc info
	        DB::table('assets')
	        	->where('asset_id', $asset_id)
	        	->delete();
	        	
	        //should also delete map marker
	        DB::table('map_markers')
	        	->where('type', 'asset')
	        	->where('type_id', $asset_id)
	        	->delete();
	        
	        //should also clear bookings's asset id
	        DB::table('bookings')
	        	->where('asset_id', $asset_id)
	        	->update([
	        		'asset_id'=>null
	        	]);
	        
            return response()->json(['status' => 200], 200);
        }
        
    	return response()->json(["error"=>"unauthorized"], 401);
    }
    
    public function mapMarkersInsert(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'map_id' => 'required|string|max:32',
	        'type' => 'required|in:human,sensor,asset',
	        'belong' => 'required|string|max:32',
	        'px' => 'required|numeric|min:0|max:1',
	        'py' => 'required|numeric|min:0|max:1',
	        'for' => 'nullable|json',
	        'remarks' => 'nullable|string|max:255'
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        $user = JWTAuth::parseToken()->authenticate();
        $map = DB::table('maps')
        	->where('company_id', $user->company_id)
        	->where('map_id', $request->input('map_id'))
        	->first();
        
        if($map == null){
    		return response()->json(["error"=>"map not found"],403);
        }
        
        // if no errors are encountered
        DB::table('map_markers')->insert([
        	'company_id' => $user->company_id,
        	'marker_id' => uniqid(),
        	'map_id' => $map->map_id, 
        	'type' => $request->input('type'), 
        	'type_id' => $request->input('belong'),
        	'px' => $request->input('px'), 
        	'py' => $request->input('py'),
        	'type_for' => $request->input('for'),
        	'remarks' => $request->input('remarks'),
        	'created_by' => $user->email,
        	'created_at' => date('Y-m-d H:i:s'),
		]);

    	return response()->json(["status"=>200],200);
    }
    
    public function mapMarkersUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'marker_id' => 'required|string|max:32',
        	'map_id' => 'required|string|max:32',
	        'type' => 'required|in:human,sensor,asset',
	        'belong' => 'required|string|max:32',
	        'px' => 'required|numeric|min:0|max:1',
	        'py' => 'required|numeric|min:0|max:1',
	        'for' => 'nullable|json',
	        'remarks' => 'nullable|string|max:255'
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        $user = JWTAuth::parseToken()->authenticate();
        $marker = DB::table('map_markers')
        	->where('marker_id', $request->input('marker_id'))
        	->first();
        
        if($marker == null){
    		return response()->json(["error"=>"marker not found"],403);
        }
        
        // if no errors are encountered
        DB::table('map_markers')
        	->where('marker_id', $request->input('marker_id'))
        	->update([
	        	'map_id' =>$request->input('map_id'), 
	        	'type' => $request->input('type'), 
	        	'type_id' => $request->input('belong'),
	        	'px' => $request->input('px'), 
	        	'py' => $request->input('py'),
	        	'type_for' => $request->input('for'),
	        	'remarks' => $request->input('remarks'),
	        	'created_by' => $user->email,
	        	'created_at' => date('Y-m-d H:i:s'),
			]);

    	return response()->json(["status"=>200],200);
    }
    
    public function mapMarkersDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'marker_id' => 'required|string|max:32',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, co owner, super admin
        $user = JWTAuth::parseToken()->authenticate();
        $marker = DB::table('map_markers')
        	->where('marker_id', $request->input('marker_id'))
        	->first();
        
        if($marker == null){
    		return response()->json(["error"=>"marker not found"],403);
        }
        
        // if no errors are encountered
        DB::table('map_markers')
	        ->where('marker_id', $request->input('marker_id'))
	        ->delete();

    	return response()->json(["status"=>200],200);
    }
    
    public function assetBookingList(Request $request){
        $validator = Validator::make($request->all(), [
        	'asset_id' => 'nullable|string|max:32',
        	'start' => 'nuallable|date_format:Y-m-d\TH:i:sP', //RFC3339 date format
        	'end' => 'nuallable|date_format:Y-m-d\TH:i:sP', //RFC3339 date format
        	'limit' => 'nullable|integer|max:100',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
        // if no errors are encountered
        // auth: acc owner, dept head, co owner, super admin
        // limitation: check the asset owner
        $user = JWTAuth::parseToken()->authenticate();
        $asset_id = $request->input('asset_id');
        $start = $request->input('start');
        $end = $request->input('end');
        $limit = $request->input('limit');
        
        if($start == null){
        	$start = date ("Y-m-d H:i:s", mktime(0,0,0,0,0,0));
        }else{
        	$start = date ("Y-m-d H:i:s", strtotime($start));
        }
        
        if($end == null){
        	$end = date ("Y-m-d H:i:s", mktime(59,59,23,31,12,9000));
        }else{
        	$end = date ("Y-m-d H:i:s", strtotime($end));
        }
        
		if($limit == null){
			$limit = 30;
		}
		
		$whereDateRange = '(start BETWEEN "'.$start.'" AND "'.$end.'" OR "'.$start.'" BETWEEN start AND end)';
        $query = DB::table('bookings')
        	->select('booking_id', 'asset_id', 'summary', 'start', 'end', 'userlist', 
        		'reminder', 'remarks', 'created_by')
			//->where('delete_flag', 0)
			->whereRaw("(JSON_CONTAINS(userlist, '[\"".$user->email."\"]') OR company_id = '".$user->company_id."')" )
        	->whereRaw ($whereDateRange);
			
		if($asset_id != null){
	        $query->where('asset_id', $asset_id);
		}
		
		$bookings = $query->limit($limit)->get();
		
        foreach ($bookings as $key => $booking){
        	$booking->userlist = json_decode($booking->userlist, true);
        }
    	return response()->json($bookings, 200);
    }
    
    public function assetBookingInsert(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'asset_id' => 'required|string|max:32',
        	'start' => 'required|date_format:Y-m-d\TH:i:sP', //RFC3339 date format
        	'end' => 'required|date_format:Y-m-d\TH:i:sP', //RFC3339 date format
        	'summary' => 'required|string',
        	'userlist' => 'required|json',
        	'remarks' => 'nullable|string',
        	'reminder' => 'nullable|json',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, co owner, super admin
        // limitation: none
        $user = JWTAuth::parseToken()->authenticate();
        $asset = DB::table('assets')
        	->where('asset_id', $request->input('asset_id'))
        	->first();
        
        if($asset == null){
    		return response()->json(["error"=>"asset not found"],403);
        }
        
        // if no errors are encountered
        DB::table('bookings')->insert([
        	'booking_id' => uniqid(),
        	'company_id' => $user->company_id,
        	'asset_id' => $request->input('asset_id'),
        	'summary' => $request->input('summary'),
        	'start' => date ("Y-m-d H:i:s", strtotime($request->input('start'))),
        	'end' => date ("Y-m-d H:i:s", strtotime($request->input('end'))),
        	'userlist' => $request->input('userlist'),
        	'reminder' => $request->input('reminder'),
        	'remarks' => $request->input('remarks'),
        	'created_by' => $user->email,
        	'created_at' => date('Y-m-d H:i:s'),
		]);

    	return response()->json(["status"=>200],200);
    }
    
    public function assetBookingUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'booking_id' => 'required|string|max:32',
        	'asset_id' => 'required|string|max:32',
        	'start' => 'required|date',
        	'end' => 'required|date',
        	'summary' => 'required|string',
        	'userlist' => 'required|json',
        	'remarks' => 'nullable|string',
        	'reminder' => 'nullable|json',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, co owner, super admin
        // limitation: none
        $user = JWTAuth::parseToken()->authenticate();
        $booking = DB::table('bookings')
        	->where('booking_id', $request->input('booking_id'))
        	->first();
        
        if($booking == null){
    		return response()->json(["error"=>"booking not found"],403);
        }
        
        // if no errors are encountered
        DB::table('bookings')
        	->where('booking_id', $booking->booking_id)->update([
        	'asset_id' => $request->input('asset_id'),
        	'summary' => $request->input('summary'),
        	'start' => date ("Y-m-d H:i:s", strtotime($request->input('start'))),
        	'end' => date ("Y-m-d H:i:s", strtotime($request->input('end'))),
        	'userlist' => $request->input('userlist'),
        	'reminder' => $request->input('reminder'),
        	'remarks' => $request->input('remarks'),
        	'updated_by' => $user->email,
        	'updated_at' => date('Y-m-d H:i:s'),
		]);

    	return response()->json(["status"=>200],200);
    }
    
    public function assetBookingDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'booking_id' => 'required|string|max:32',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 400);
        }
        
        // if no errors are encountered
        // auth: dept head, co owner, super admin
        // limitation: none
        $user = JWTAuth::parseToken()->authenticate();
        $booking = DB::table('bookings')
        	->where('asset_id', $request->input('booking_id'))
        	->first();
        
        if($booking == null){
    		return response()->json(["error"=>"booking not found"],403);
        }
        
        // if no errors are encountered
        DB::table('bookings')
        	->where('booking_id', $booking->booking_id)
        	->delete();

    	return response()->json(["status"=>200],200);
    }
}
