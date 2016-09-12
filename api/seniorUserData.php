<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/seniorUserDataFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {
		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get data about a senior user from DB
				if (isset($_GET["seniorUserID"])) {
					$seniorUserID = $_GET["seniorUserID"];
					
					$seniorUserDetails = getSeniorUserData($tokenUserID, $seniorUserID);

					if (empty($seniorUserDetails)) {
						deliver_response(200, "No results found.", NULL);
					} else {
						deliver_response(200, "Senior user details found.", $seniorUserDetails);
					}
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parameter.", NULL);
				}
				break;


			case 'POST':
				// Store a new senior user to DB
				if (isset($_POST["expertUserID"]) && isset($_POST["username"]) && isset($_POST["password"]) && isset($_POST["firstName"]) && isset($_POST["lastName"]) && isset($_POST["birthDate"]) && isset($_POST["isMale"])) {
			
					$dbWriteSuccess = postSeniorUserData($expertUserID);
					
					if ($dbWriteSuccess) {
						deliver_response(200, "Brukeren ble lagret i databasen.", true);
					} else {
						deliver_response(200, "Det oppstod en feil, og en eller flere tabeller ble ikke oppdatert.", false);
					}
				} else {
					deliver_response(400, "Ugyldig POST-forespørsel: mangler parametre.", NULL);
				}
				break;


			case 'PUT':
				// Change user data for a senior user in DB
				parse_str(file_get_contents('php://input'), $_POST);

				if (isset($_POST["firstName"]) && isset($_POST["lastName"]) && isset($_POST["username"]) && isset($_POST["seniorUserID"])) {

					$dbWriteSuccess = putSeniorUserData($tokenUserID);

					if ($dbWriteSuccess) {
						deliver_response(200, "Opplysningene ble lagret i databasen.", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig PUT-forespørsel: mangler parametre.", NULL);
				}
				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET, POST, PUT", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>