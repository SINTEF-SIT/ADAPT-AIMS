<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($seniorUserID, $mobilityIdx, $timeDataCollected) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("INSERT INTO MobilityIndexes (userID, timeCalculated, timeDataCollected, value) VALUES (?, NOW(), ?, ?);")) {
			$stmt->bind_param("isd", $seniorUserID, $timeDataCollected, $mobilityIdx);
			$stmt->execute();
			return true;
		} else {
			return false;
		}

		$conn->close();
	}

	$validToken = validateToken();

	if ($validToken == true) {
		if (isset($_POST["userID"]) && isset($_POST["mobilityIdx"]) && isset($_POST["timeDataCollected"])) {
			$seniorUserID = $_POST["userID"];
	    	$mobilityIdx = $_POST["mobilityIdx"];
	    	$timeDataCollected = $_POST["timeDataCollected"];

			$dbWriteSuccess = wirteDB($seniorUserID, $mobilityIdx, $timeDataCollected);

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