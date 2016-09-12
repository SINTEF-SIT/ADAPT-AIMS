<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/hasAccessedSystemFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'PUT':
				// Set a value for senior user that the system has been accessed

				if (isset($_GET["seniorUserID"])) {

					$dbWriteSuccess = putHasAccessedSystem($tokenUserID, $_GET["seniorUserID"]);

					if ($dbWriteSuccess) {
						deliver_response(200, "Databasen er nå oppdatert med at denne brukeren har aksessert systemet.", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig PUT-forespørsel: mangler parameter.", NULL);
				}
				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: PUT", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>