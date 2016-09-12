<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/expertUserOverviewFunctions.php');

	$tokenAdminUserID = validateToken();

	if ($tokenAdminUserID === 0) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get all expert users and the ID's of their connected senior users
				$expertUsers = getExpertUserOverview();

				if (empty($expertUsers)) {
					deliver_response(200, "No results found.", NULL);
				} else {
					deliver_response(200, "Expert users found.", $expertUsers);
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