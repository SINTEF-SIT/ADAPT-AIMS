<?php
    
    
	if (!function_exists('getkey')) {

    #the keyfile needs to reside in api/key.txt for the webserver to read it, or
    #in api/inc/ for the generateHash code (in util/) to read it.
    #TODO: clean up this messy function..

    function getkey() {
      if(apc_exists('adaptkey') && strlen(apc_fetch('adaptkey')) != 0){
	      error_log("found adaptkey");
        $key = rtrim(apc_fetch('adaptkey'));
        return $key;
      }else{
	      error_log("did not find adaptkey, loading from file");
        $key = file_get_contents('./key.txt', FILE_USE_INCLUDE_PATH);
        if($key == ""){
          error_log("could not read key from file");
        }else{
          error_log("successfully read key from file ");
        }
        $key = rtrim($key);
        apc_store('adaptkey',$key,0);
        return $key;
      }
    }
}
if (!function_exists('encrypt')) {
    function encrypt($string) {
        $string = rtrim(base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, md5(getkey()), $string, MCRYPT_MODE_ECB)));
        return $string;
    }
}

if (!function_exists('decrypt')) {
    function decrypt($string) {
        $string = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5(getkey()), base64_decode($string), MCRYPT_MODE_ECB));
        return $string;
    }
}

if (!function_exists('hashword')) {
    function hashword($string) {
        $string = crypt($string, '$1$' . md5(getkey()) . '$');
        return $string;
    }
}
	if (!function_exists('deliver_response')) {
	function deliver_response($status, $status_message, $data) {
		header("HTTP/1.1 $status $status_message");
		
		// Todo: remove after development phase:
		//header('Access-Control-Allow-Origin: http://localhost');

		//header('Content-type: text/plain; charset=utf-8');
		header("Content-Type:application/json");
		
		$response['status'] = $status;
		$response['status_message'] = $status_message;
		$response['data'] = $data;

		$json_response=json_encode($response);
		echo $json_response;
	}
}
?>