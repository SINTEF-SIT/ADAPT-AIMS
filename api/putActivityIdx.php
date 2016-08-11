<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($activityIdx, $activityIndexID, $expertUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT userID FROM ActivityIndexes WHERE activityIndexID = ?;")) {
			$stmt->bind_param("i", $activityIndexID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				if (checkExpertSeniorLink($conn, $expertUserID, $row["userID"])) {

					if ($stmt = $conn->prepare("UPDATE ActivityIndexes SET timeCalculated=UTC_TIMESTAMP(), value=? WHERE activityIndexID=?;")) {
						$stmt->bind_param("di", $activityIdx, $activityIndexID);
						$stmt->execute();

						$stmt->close();
						$conn->close();
						return true;
					}
				}
			}
		}
		$conn->close();
		return false;		
	}

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_POST["activityIdx"]) && isset($_POST["activityIndexID"])) {
			$activityIdx = $_POST["activityIdx"];
	    	$activityIndexID = $_POST["activityIndexID"];

			$dbWriteSuccess = wirteDB($activityIdx, $activityIndexID, $tokenUserID);

			if ($dbWriteSuccess) {
				deliver_response(200, "Verdien AI=" . $activityIdx . " ble lagret i databasen.", true);
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