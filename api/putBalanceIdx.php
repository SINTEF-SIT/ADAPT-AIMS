<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($balanceIdx, $balanceIndexID, $expertUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT userID FROM BalanceIndexes WHERE balanceIndexID = ?;")) {
			$stmt->bind_param("i", $balanceIndexID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				if (checkExpertSeniorLink($conn, $expertUserID, $row["userID"])) {

					if ($stmt = $conn->prepare("UPDATE BalanceIndexes SET timeCalculated=UTC_TIMESTAMP(), value=? WHERE balanceIndexID=?;")) {
						$stmt->bind_param("di", $balanceIdx, $balanceIndexID);
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
		if (isset($_POST["balanceIdx"]) && isset($_POST["balanceIndexID"])) {
			$balanceIdx = $_POST["balanceIdx"];
	    	$balanceIndexID = $_POST["balanceIndexID"];

			$dbWriteSuccess = wirteDB($balanceIdx, $balanceIndexID, $tokenUserID);

			if ($dbWriteSuccess) {
				deliver_response(200, "Verdien BI=" . $balanceIdx . " ble lagret i databasen.", true);
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