<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($mobilityIdx, $mobilityIndexID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("UPDATE MobilityIndexes SET timeCalculated=NOW(), value=? WHERE mobilityIndexID=?;")) {
			$stmt->bind_param("di", $mobilityIdx, $mobilityIndexID);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return true;
		} else {
			$conn->close();
			return false;
		}

		$conn->close();
	}

	$validToken = validateToken();

	if ($validToken == true) {
		if (isset($_POST["mobilityIdx"]) && isset($_POST["mobilityIndexID"])) {
			$mobilityIdx = $_POST["mobilityIdx"];
	    	$mobilityIndexID = $_POST["mobilityIndexID"];

			$dbWriteSuccess = wirteDB($mobilityIdx, $mobilityIndexID);

			if ($dbWriteSuccess) {
				deliver_response(200, "Verdien " . $mobilityIdx . " for bruker-ID = " . $seniorUserID . " ble lagret i databasen.", true);
			} else {
				deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
			}
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>