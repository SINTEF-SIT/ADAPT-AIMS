<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	require 'inc/KeySMS.php';

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {
		if (isset($_POST["msg"]) && (isset($_POST["phone"]) || isset($_POST["phone%5B%5D"]) || isset($_POST["phone[]"]))) {
			$msg = $_POST["msg"];
			$phone = $_POST["phone"];

			$username = '';
			$authKey = ''; // API key, generated in app.keysms.no

			$keysms = new KeySMS;
			$keysms->auth($username, $authKey);

			$plural = "";

			if (isset($_POST["bulk"])) {
				$response = $keysms->sms($msg, $phone);
				$plural = "ene";
			} else {
				$response = $keysms->sms($msg, array($phone));
			}

			deliver_response(200, "SMS" . $plural . " ble sendt.", $response);
			
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>