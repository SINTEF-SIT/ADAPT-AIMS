<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function putData($seniorUserID, $tokenUserID) {
		include('../inc/db.inc.php');
			
		if ($stmt = $conn->prepare("UPDATE SeniorUsers SET hasAccessedSystem='1' WHERE userID=?;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$stmt->close();
			$conn->close();
			return true;
		}
		$conn->close();
		return false;
	}

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'PUT':
				// Set a value for senior user that the system has been accessed

				if (isset($_GET["seniorUserID"])) {

					$dbWriteSuccess = putData($_GET["seniorUserID"], $tokenUserID);

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