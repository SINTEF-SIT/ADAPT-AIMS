<?php
	include('deliver_response.inc.php');

	function wirteDB($seniorUserID, $feedbackText) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("INSERT INTO FeedbackMsgCustom (userID, feedbackText, timeCreated) VALUES (?, ?, NOW());")) {
			$stmt->bind_param("is", $seniorUserID, $feedbackText);
			$stmt->execute();
			return true;
		} else {
			return false;
		}

		$conn->close();
	}

	header("Content-Type:application/json");

	if (!empty($_POST["userID"]) && !empty($_POST["feedbackText"])) {
		$seniorUserID = $_POST["userID"];
    	$feedbackText = $_POST["feedbackText"];

		$dbWriteSuccess = wirteDB($seniorUserID, $feedbackText);

		if ($dbWriteSuccess) {
			deliver_response(200, "Teksten ble vellykket skrevet til databasen for bruker-ID = " . $seniorUserID . ".", true);
		} else {
			deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
		}
	} else {
		deliver_response(400, "Ugyldig forespørsel.", NULL);
	}
?>