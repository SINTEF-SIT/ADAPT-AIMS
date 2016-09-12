<?php
	include('inc/deliver_response.inc.php');
	include('dbFunctions/loginFunctions.php');

	if (isset($_POST['username']) && isset($_POST['password'])) {

		$username = $_POST['username'];
		$password = $_POST['password'];

		if ($username == "admin") {
			$userData = getLoginDataAdmin($password);
		} else {
			$userData = getLoginData($username, $password);
		}

		if (empty($userData)) {
			deliver_response(200, "Ugyldig brukernavn/passord.", NULL);
		} else {
			deliver_response(200, "Bruker funnet.", $userData);
		}
	} else {
		deliver_response(400, "Ugyldig forespørsel.", NULL);
	}
?>