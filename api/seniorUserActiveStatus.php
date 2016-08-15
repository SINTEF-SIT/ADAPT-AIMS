<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function putData($expertUserID, $seniorUserID) {
		include('../inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $seniorUserID)) {
			if ($stmt = $conn->prepare("UPDATE SeniorUsers SET active = b'0' WHERE userID = ?")) {
				$stmt->bind_param("i", $seniorUserID);
				$stmt->execute();
				$stmt->close();
				$conn->close();
				return true;
			} else {
				$stmt->close();
				$conn->close();
				return false;
			}
		} else {
			return false;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'PUT':
				// Set a senior user as inactive
				if (isset($_GET["seniorUserID"])) {
					$dbWriteSuccess = putData($tokenUserID, $_GET["seniorUserID"]);
					
					if ($dbWriteSuccess) {
						deliver_response(200, "Brukeren ble satt som inaktiv.", true);
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