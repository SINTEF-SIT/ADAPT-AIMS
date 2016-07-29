<?php
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
?>