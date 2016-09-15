<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/expertUsersFunctions.php');

	$tokenAdminUserID = validateToken();

	if ($tokenAdminUserID === 0) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get all expert users and the ID's of their connected senior users
				$expertUsers = getExpertUsers();

				if (empty($expertUsers)) {
					deliver_response(200, "No results found.", NULL);
				} else {
					deliver_response(200, "Expert users found.", $expertUsers);
				}
				break;
			case 'POST':
				// Store a new expert user in DB
				if (isset($_POST["username"]) && isset($_POST["password"]) && isset($_POST["firstName"]) && isset($_POST["lastName"])) {
					$username = $_POST["username"];
					$password = $_POST["password"];
					$firstName = $_POST["firstName"];
					$lastName = $_POST["lastName"];

					$userID = postExpertUser($username, $password, $firstName, $lastName);

					if ($userID) {
						$user = array(
							"userID" => $userID,
							"password" => $password,
							"firstName" => $firstName,
							"lastName" => $lastName,
						);
						deliver_response(200, "Ekspertbrukeren ble vellykket skrevet til databasen.", $user);
					} else {
						deliver_response(200, "Det oppstod en feil.", NULL);
					}
				} else {
					deliver_response(400, "Ugyldig POST-forespørsel: mangler parametre.", NULL);
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