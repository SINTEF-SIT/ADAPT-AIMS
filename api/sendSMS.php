<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	require 'KeySMS.php';

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_POST["msg"]) && isset($_POST["phone"])) {
			$msg = $_POST["msg"];
			$phone = $_POST["phone"];

			$username = '99286869';
			$authKey = '47ee61e1c5491d85af46dad9ffb29978'; // API key, generated in app.keysms.no

			$keysms = new KeySMS;
			$keysms->auth($username, $authKey);
			$response = $keysms->sms($msg, array($phone));

			deliver_response(200, "SMSen ble sendt.", $response);
			
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>