<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($seniorUserID, $feedbackText, $category, $expertUserID) {
		include('../inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $seniorUserID)) {
			
			$exerciseID = (isset($_POST["exerciseID"]) && $_POST["exerciseID"] != "-1") ? $_POST["exerciseID"] : NULL;

			if ($stmt = $conn->prepare("INSERT INTO FeedbackMsgCustom (userID, feedbackText, timeCreated, category, exerciseID) VALUES (?, ?, UTC_TIMESTAMP(), ?, ?);")) {
				$stmt->bind_param("isii", $seniorUserID, encrypt($feedbackText), $category, $exerciseID);
				$stmt->execute();

				$stmt->close();
				$conn->close();
				return true;
			} else {
				$conn->close();
				return false;
			}
		} else {
			return false;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_POST["userID"]) && isset($_POST["feedbackText"]) && isset($_POST["category"])) {
			$seniorUserID = $_POST["userID"];
	    	$feedbackText = $_POST["feedbackText"];
	    	$category = $_POST["category"];

			$dbWriteSuccess = wirteDB($seniorUserID, $feedbackText, $category, $tokenUserID);

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