<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/exerciseGroupsFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {	

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get data about physical exercises
				$res = getExerciseGroups();

				if (empty($res)) {
					deliver_response(200, "Ingen øvelser er funnet i databasen.", NULL);
				} else {
					deliver_response(200, "Øvelser funnet.", $res);
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