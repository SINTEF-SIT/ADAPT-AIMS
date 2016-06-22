<?php
	include('deliver_response.inc.php');

	function deleteFromDB($userID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("UPDATE SeniorUsers SET active = b'0' WHERE userID = ?")) {
			$stmt->bind_param("i", $userID);
			$stmt->execute();
			return true;
		} else {
			return false;
		}

		$conn->close();
	}

	header("Content-Type:application/json");

	if (!empty($_GET["seniorUserID"])) {
		$dbWriteSuccess = deleteFromDB($_GET["seniorUserID"]);
		
		if ($dbWriteSuccess) {
			deliver_response(200, "Brukeren ble satt som inaktiv.", true);
		} else {
			deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
		}
	} else {
		deliver_response(400, "Ugyldig foresp\u00f8rsel.", NULL);
	}
?>