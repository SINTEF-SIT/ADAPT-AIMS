<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	require 'KeySMS.php';

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_POST["msg"]) && isset($_POST["phone"])) {
			$msg = $_POST["msg"];
			$phone = $_POST["phone"];

			$username = '';
			$authKey = ''; // api key, generated in-app

			$keysms = new KeySMS;
			$keysms->auth($username, $authKey);
			$response = $keysms->sms($msg, array($phone));

			deliver_response(200, "Følgende tekst ble sendt som SMS til " . $phone . ": '" . $msg . "'", true);
			
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>