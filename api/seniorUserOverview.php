<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/seniorUserOverviewFunctions.php');

	$tokenExpertUserID = validateToken();

	if ($tokenExpertUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				$seniorUsers = null;
				if ($tokenExpertUserID === 0) { // if user is admin
					$seniorUsers = getAllSeniorUserOverviewData();
				} else {
					// Get a summary of user data for all senior users an expert user has access to
					$seniorUsers = getSeniorUserOverview($tokenExpertUserID);
				}

				if (empty($seniorUsers)) {
					deliver_response(200, "No results found.", NULL);
				} else {
					deliver_response(200, "Senior users found.", $seniorUsers);
				}
				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>