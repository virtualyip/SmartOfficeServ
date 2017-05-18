<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

use Tymon\JWTAuth\Exceptions\JWTException;
use JWTAuth;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
    
	public function getAuthenticatedUser(){
		try {
			
	        if (! $user = JWTAuth::parseToken()->authenticate()) {
	            return null; //response()->json(['user_not_found'], 404);
	        }
	        
		    // the token is valid and we have found the user via the sub claim
		    return $user;
		    
	    } catch (Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
	
	        return null; //response()->json(['token_expired'], $e->getStatusCode());
	
	    } catch (Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
	
	        return null; //response()->json(['token_invalid'], $e->getStatusCode());
	
	    } catch (Tymon\JWTAuth\Exceptions\JWTException $e) {
	
	        return null; //response()->json(['token_absent'], $e->getStatusCode());
	
	    }
	
	}
}
