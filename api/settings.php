<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function getData() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT * FROM Settings;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$conn->close();
				return mysqli_fetch_assoc($result);
			}
		}
		$conn->close();
		return NULL;
	}

	function putData($BIThresholdLower, $BIThresholdUpper) {
		
		include('inc/db.inc.php');
			
		if ($stmt = $conn->prepare("UPDATE Settings SET BIThresholdLower=?, BIThresholdUpper=?;")) {
			$stmt->bind_param("dd", $BIThresholdLower, $BIThresholdUpper);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return true;
		}
		$conn->close();
		return false;
	}

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get settings values
				$res = getData();

				if (empty($res)) {
					deliver_response(200, "Ingen innstillinger funnet.", NULL);
				} else {
					deliver_response(200, "Innstillinger funnet.", $res);
				}
				break;

			case 'PUT':
				// Update settings values
				if (isset($_GET["BIThresholdLower"]) && isset($_GET["BIThresholdUpper"])) {
					$dbWriteSuccess = putData($_GET["BIThresholdLower"], $_GET["BIThresholdUpper"]);

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