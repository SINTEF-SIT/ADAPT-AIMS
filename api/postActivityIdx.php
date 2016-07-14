<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB() {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("INSERT INTO ActivityIndexes (userID, timeCalculated, timeDataCollected, value) VALUES (?, NOW(), ?, ?);")) {
			$stmt->bind_param("isi", $_POST["userID"], $_POST["timeDataCollected"], $_POST["activityIdx"]);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return true;
		} else {
			$conn->close();
			return false;
		}
	}

	$validToken = validateToken();

	if ($validToken == true) {
		if (isset($_POST["userID"]) && isset($_POST["timeDataCollected"]) && isset($_POST["activityIdx"])) {
			$dbWriteSuccess = wirteDB();

			if ($dbWriteSuccess) {
				deliver_response(200, "Verdien " . $_POST["activityIdx"] . " for bruker-ID=" . $_POST["userID"] . " på dato " . $_POST["timeDataCollected"] . " ble lagret i databasen.", true);
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