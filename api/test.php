<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/testFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get personalized feedback messages to a senior user
				if (isset($_GET["seniorUserID"])) {
					$bi = isset($_GET["bi"]) ? $_GET["bi"] : null;
					$ai = isset($_GET["ai"]) ? $_GET["ai"] : null;
					$res = getFeedback($tokenUserID, $_GET["seniorUserID"], $bi, $ai);

					if (empty($res)) {
						deliver_response(200, "Ingen feedback-meldinger er lagret i databasen.", NULL);
					} else {
						deliver_response(200, "Feedback funnet.", $res);
					}
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parameter.", NULL);
				}
				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET, POST, PUT, DELETE", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
		
?>