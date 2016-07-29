<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($mobilityIdx, $mobilityIndexID, $expertUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT userID FROM MobilityIndexes WHERE mobilityIndexID = ?;")) {
			$stmt->bind_param("i", $mobilityIndexID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				if (checkExpertSeniorLink($conn, $expertUserID, $row["userID"])) {

					if ($stmt = $conn->prepare("UPDATE MobilityIndexes SET timeCalculated=UTC_TIMESTAMP(), value=? WHERE mobilityIndexID=?;")) {
						$stmt->bind_param("di", $mobilityIdx, $mobilityIndexID);
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
		if (isset($_POST["mobilityIdx"]) && isset($_POST["mobilityIndexID"])) {
			$mobilityIdx = $_POST["mobilityIdx"];
	    	$mobilityIndexID = $_POST["mobilityIndexID"];

			$dbWriteSuccess = wirteDB($mobilityIdx, $mobilityIndexID, $tokenUserID);

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