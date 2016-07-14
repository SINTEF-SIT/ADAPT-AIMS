<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($seniorUserID, $feedbackText, $category) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("INSERT INTO FeedbackMsgCustom (userID, feedbackText, timeCreated, category) VALUES (?, ?, NOW(), ?);")) {
			$stmt->bind_param("isi", $seniorUserID, encrypt($feedbackText), $category);
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
		if (isset($_POST["userID"]) && isset($_POST["feedbackText"]) && isset($_POST["category"])) {
			$seniorUserID = $_POST["userID"];
	    	$feedbackText = $_POST["feedbackText"];
	    	$category = $_POST["category"];

			$dbWriteSuccess = wirteDB($seniorUserID, $feedbackText, $category);

			if ($dbWriteSuccess) {
				deliver_response(200, "Teksten ble vellykket skrevet til databasen for bruker-ID = " . $seniorUserID . ".", true);
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