<?php
	include('deliver_response.inc.php');

	function wirteDB($seniorUserID, $mobilityIdx) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("INSERT INTO MobilityIndexes (userID, timeCalculated, timeDataCollected, value) VALUES (?, NOW(), NOW(), ?);")) {
			$stmt->bind_param("ii", $seniorUserID, $mobilityIdx);
			$stmt->execute();
			return true;
		} else {
			return false;
		}

		$conn->close();
	}

	header("Content-Type:application/json");

	if (!empty($_POST["userID"]) && !empty($_POST["mobilityIdx"])) {
		$seniorUserID = $_POST["userID"];
    	$mobilityIdx = $_POST["mobilityIdx"];

		$dbWriteSuccess = wirteDB($seniorUserID, $mobilityIdx);

		if ($dbWriteSuccess) {
			deliver_response(200, "Verdien " . $mobilityIdx . " for bruker-ID = " . $seniorUserID . " ble lagret i databasen.", true);
		} else {
			deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
		}
	} else {
		deliver_response(400, "Ugyldig forespørsel.", NULL);
	}
?>