<?php namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Exceptions\JWTException;
use JWTAuth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class ImageController extends Controller {

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
	public function index($folder, $filename)
	{
        //auth: all users
	    $path = storage_path() . '/app/' . $folder . '/' . $filename;

	    if(!File::exists($path)) 
	    	return response()->json("$path file not found", 404);;
	
	    $file = File::get($path);
	    $type = File::mimeType($path);
	
	    $response = response()->make($file, 200);
	    $response->header("Content-Type", $type);
	
	    return $response;
	}
	
	function resize_image($file, $w, $h, $crop=FALSE) {
	    $size = getimagesize($file);
	    $r = $size[0] / $size[1];
	    if ($crop) {
	        if ($width > $height) {
	            $width = ceil($width-($width*abs($r-$w/$h)));
	        } else {
	            $height = ceil($height-($height*abs($r-$w/$h)));
	        }
	        $newwidth = $w;
	        $newheight = $h;
	    } else {
	        if ($w/$h > $r) {
	            $newwidth = $h*$r;
	            $newheight = $h;
	        } else {
	            $newheight = $w/$r;
	            $newwidth = $w;
	        }
	    }
	    $src = null;
	    if($size[2] == 0)  {
	        $src = imagecreatefromjpeg($file);
	    } else if($size[2] == 1)  {
	        $src = imagecreatefromgif($file);
	    } else if($size[2] == 2) {
	        $src = imagecreatefrompng($file);
	    }
	    $dst = imagecreatetruecolor($newwidth, $newheight);
	    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newwidth, $newheight, $width, $height);
	
	    return $dst;
	}
	
	public function store($data, $path)
  	{
      if (preg_match('/data:image\/(gif|jpeg|png);base64,(.*)/i', $data, $matches)) {
          $imageType = $matches[1];
          $imageData = base64_decode($matches[2]);
          $image = imagecreatefromstring($imageData);
          //$filename = md5($imageData) . '.png';
          //$filePath = $path . '/' . $filename;
  
          if (imagepng($image, $path)) {
              return true;
          } else {
              throw new Exception('Could not save the file.');
              return false;
          }
      } else {
          throw new Exception('Invalid data URL.');
          return false;
      }
    }
	
	public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
	        'img' => 'required|string',
        	'type' => 'required|in:maps,users,sensors,assets,other',
        	'type_id' => 'required',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 403);
        }
        
        //auth: acc owner, dept head, company owner, super admin
    	$user = JWTAuth::parseToken()->authenticate();
    	$imgData = $request->input('img');
        $type = $request->input('type');
        $type_id = $request->input('type_id');
        $filename = $type . '/' . md5($imgData) . '.png';
        $path = storage_path() . '/app/';
        
        if($type == 'maps'){
        	//a company can have max 4 floor plan images
        	if($type_id <= 0 || $type_id >= 4)
				return response()->json("error", 403);
			
			//check it is new img or update img
			$result = DB::table('maps')
				->where('company_id', $user->company_id)
				->where('i',$type_id)
				->first();
				
			if($result == null){
				//insert new image
				//$path = $request->file('img')->store('maps');
				if(!$this->store($imgData, $path . $filename)) {
					return response()->json(["error"=>"cannot save image"], 403);
				}
				
				DB::table('maps')->insert([
					'company_id' => $user->company_id,
					'i' => $type_id,
					'map_id' => uniqid(),
					'img' => $filename,
        			'created_at' => date('Y-m-d H:i:s'),
					'created_by' => $user->email
				]);
			}else{
				//delete old image
				if($result->img != null)
					Storage::delete($path . $result->img);
				
				//update new image
				//$path = $request->file('img')->store($type);
				if(!$this->store($imgData, $path . $filename)) {
					return response()->json(["error"=>"cannot save image"], 403);
				}
					
				DB::table('maps')
					->where('company_id', $user->company_id)
					->where('i',$type_id)
					->update([
						'img' => $filename,
	        			'created_at' => date('Y-m-d H:i:s'),
						'created_by' => $user->email
					]);
			}
			return response()->json($path, 200);
        }
        
        if($type == 'users'){
	        $email = $type_id;
	        if($user->email == $email || $user->email == DB::table('companies')->where('company_id', $user->company_id)->first()->created_by ){
				//check it is new img or update img
				$result = DB::table('users')
					->where('company_id', $user->company_id)
					->where('email', $email)
					->first();
					
				if($result->img != null){
					//delete old image
					Storage::delete($path.$result->img);
				}
				
				//insert new image
				//$path = $request->file('img')->store($type);
				if(!$this->store($imgData, $path . $filename)) {
					return response()->json(["error"=>"cannot save image"], 403);
				}
					
				DB::table('users')
					->where('company_id', $user->company_id)
					->where('email', $email)
					->update([
						'img' => $filename,
		    			'created_at' => date('Y-m-d H:i:s'),
					]);
				return response()->json($path, 200);
	        }else{
	    		return response()->json(["error"=>"unauthorized"], 401);
	    	}
	        
		}
	        
        if($type == 'sensors'){
	        $sensor_id = $type_id;
	        
	        if(true ){ //auth
				//check it is new img or update img
				$result = DB::table('sensors')
					->where('company_id', $user->company_id)
					->where('sensor_id', $sensor_id)
					->first();
					
				if($result->img != null){
					//delete old image
					Storage::delete($path.$result->img);
				}
				
				//insert new image
				//$path = $request->file('img')->store($type);
				if(!$this->store($imgData, $path . $filename)) {
					return response()->json(["error"=>"cannot save image"], 403);
				}
					
				DB::table('sensors')
					->where('company_id', $user->company_id)
					->where('sensor_id', $sensor_id)
					->update([
						'img' => $filename,
		    			'created_at' => date('Y-m-d H:i:s'),
					]);
				return response()->json($path, 200);
	        }else{
	    		return response()->json(["error"=>"unauthorized"], 401);
	    	}
	        
        }
        
        if($type == 'assets'){
	        $asset_id = $type_id;
	        
	        if(true ){ //auth
				//check it is new img or update img
				$result = DB::table('assets')
					->where('company_id', $user->company_id)
					->where('asset_id', $asset_id)
					->first();
					
				if($result->img != null){
					//delete old image
					Storage::delete($path.$result->img);
				}
				
				//insert new image
				//$path = $request->file('img')->store($type);
				if(!$this->store($imgData, $path . $filename)) {
					return response()->json(["error"=>"cannot save image"], 403);
				}
					
				DB::table('assets')
					->where('company_id', $user->company_id)
					->where('asset_id', $asset_id)
					->update([
						'img' => $filename,
		    			'created_at' => date('Y-m-d H:i:s'),
					]);
				return response()->json($path, 200);
	        }else{
	    		return response()->json(["error"=>"unauthorized"], 401);
	    	}
	        
        }
    }
    
    public function submit(Request $request)
    {
        $validator = Validator::make($request->all(), [
	        'path' => 'required',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    $type = $request->input('type');
	    $path = $request->input('path');
	    $submit_path = str_replace('temp',$type,$path);
	    
	    if(!Storage::exists($path)) 
	    	return response()->json("file not found", 404);;
	
	    if(Storage::exists($submit_path)) 
	    	return response()->json("file already exist", 200);;
	
	    //move temp img to submitted folder
	    Storage::move($path, $submit_path);
	    if(Storage::exists($submit_path)) 
			return response()->json("submitted", 200);
		else
			return response()->json("error", 500);
    }
    
    public function delete(Request $request)
    {
        $validator = Validator::make($request->all(), [
        	'type' => 'required|in:maps,icons,other',
        	'type_id' => 'required|max:32',
        	'i' => 'required|integer',
	    ],[
	    	'required' => 'Some values are missing.',
	    ]);
	    
	    if ($validator->fails()) {
            return response()->json($validator->errors()->all(), 403);
        }
        
        //auth: acc owner, dept head, company owner, super admin
    	$user = JWTAuth::parseToken()->authenticate();
    	$type = $request->input('type');
    	$type_id = $request->input('type_id');
    	$i = $request->input('i');
    	
    	if($type == 'maps'){
			$map = DB::table('maps')
				->where('map_id', $type_id)
				->where('company_id', $user->company_id)
				->where('i', $i)
				->first();
				
			if($map == null)
    			return response()->json(["image not found"=>404],404);
			
        	$path = storage_path() . '/app/' . $map->img;
			DB::table('maps')
				->where('map_id', $type_id)
				->where('company_id', $user->company_id)
				->where('i', $i)
				->update([
					'img' => null,
        			'created_at' => date('Y-m-d H:i:s'),
					'created_by' => $user->email
				]);
			
			Storage::delete($path);
    		return response()->json(["status"=>200],200);
    	}
    	
    	if($type == 'icons'){
			$icon = DB::table('users')
				->where('user_id', $type_id)
				->where('company_id', $user->company_id)
				->where('i', $i)
				->first();
				
			if($icon == null)
    			return response()->json(["image not found"=>404],404);
			
        	$path = storage_path() . '/app/' . $icon->img;
			DB::table('users')
				->where('user_id', $type_id)
				->where('company_id', $user->company_id)
				->where('i', $i)
				->update([
					'img' => null,
        			'created_at' => date('Y-m-d H:i:s'),
					'created_by' => $user->email
				]);

			Storage::delete($path);
    		return response()->json(["status"=>200],200);
    	}
    }
}
