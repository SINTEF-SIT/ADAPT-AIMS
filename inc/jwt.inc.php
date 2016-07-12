<?php
	function generateToken($userID) {
		$key = "test";

		$header = [
			'typ' => 'JWT',
			'alg' => 'HS256'
		];

		$header = json_encode($header);
		$header = base64_encode($header);

		$payload = [
			'iss' => 'ADAPT',
			'userid' => $userID
		];

		$payload = json_encode($payload);
		$payload = base64_encode($payload);

		$signature = hash_hmac('sha256', "$header.$payload", $key, true);
		$signature = base64_encode($signature);

		return "$header.$payload.$signature";
	}

	function validateToken() {
		$clientToken = null;
		$headers = apache_request_headers();
		
		if (isset($headers['Authorization'])) {
			$authHeaderParts = explode(" ", $headers['Authorization']);
			if (isset($authHeaderParts[1])) {
				$clientToken = $authHeaderParts[1];

				$clientTokenParts = explode(".", $clientToken);
				$clientPayload = json_decode(base64_decode($clientTokenParts[1]), true);

				$clientUserID = $clientPayload['userid'];

				$generatedToken = generateToken($clientUserID);
				return ($clientToken === $generatedToken);
			}
		}
		return false;
	}
?>