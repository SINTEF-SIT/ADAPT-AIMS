<?php
	include(
'inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function putData($seniorUserID, $category, $value, $tokenUserID) {
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID)) {
			
			$query = "UPDATE SeniorUsers SET showPersonalizedAIFeedback=? WHERE userID=?;"; // AI
			if ($category == "1") { // BI
				$query = "UPDATE SeniorUsers SET showPersonalizedBIFeedback=? WHERE userID=?;";
			}

			if ($stmt = $conn->prepare($query)) {
				$stmt->bind_param("ii", $value, $seniorUserID);
				$stmt->execute();
				$stmt->close();
				$conn->close();
				return true;
			}
		}
		$conn->close();
		return false;
	}

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'PUT':
				// Set a senior user as inactive
				if (isset($_GET["seniorUserID"]) && isset($_GET["category"]) && isset($_GET["value"])) {

					$dbWriteSuccess = putData($_GET["seniorUserID"], $_GET["category"], $_GET["value"], $tokenUserID);

					if ($dbWriteSuccess) {
						deliver_response(200, "Opplysningene ble lagret i databasen.", true);
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