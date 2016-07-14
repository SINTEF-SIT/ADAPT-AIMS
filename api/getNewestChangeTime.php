<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($seniorUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT timeCalculated FROM MobilityIndexes WHERE userID = ?
				UNION SELECT timeCalculated FROM ActivityIndexes WHERE userID = ?
				UNION SELECT timeCalculated FROM BalanceIndexes WHERE userID = ?
				UNION SELECT timeCreated FROM FeedbackMsgCustom WHERE userID = ?
				ORDER BY timeCalculated DESC LIMIT 1;")) {
			$stmt->bind_param("iiii", $seniorUserID, $seniorUserID, $seniorUserID, $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				return mysqli_fetch_assoc($result);
			} else {
				return NULL;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	$validToken = validateToken();

	if ($validToken == true) {
		if (isset($_GET["seniorUserID"])) {
			$seniorUserID = $_GET["seniorUserID"];

			$time = readDB($seniorUserID);

			if (empty($time)) {
				deliver_response(200, "Ingen data er registrert ennå.", NULL);
			} else {
				deliver_response(200, "Timestamp funnet.", $time);
			}
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>