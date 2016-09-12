<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/settingsFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get settings values
				$res = getSettings();

				if (empty($res)) {
					deliver_response(200, "Ingen innstillinger funnet.", NULL);
				} else {
					deliver_response(200, "Innstillinger funnet.", $res);
				}
				break;

			case 'PUT':
				// Update settings values
				if (isset($_GET["BIThresholdLower"]) && isset($_GET["BIThresholdUpper"])) {
					$dbWriteSuccess = putSettings($_GET["BIThresholdLower"], $_GET["BIThresholdUpper"]);

					if ($dbWriteSuccess) {
						deliver_response(200, "Innstillingene ble lagret i databasen.", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig PUT-forespørsel: mangler parametre.", NULL);
				}
				break;

			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET, PUT", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
		
?>