<?php
	function getBalanceIdx($tokenUserID, $seniorUserID) {
		include('inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return NULL;
			}
		}

		$query = "SELECT balanceIndexID, value, dateFrom, dateTo, timeUpdated
				FROM BalanceIndexes
				WHERE userID=?
				ORDER BY dateFrom ASC;";

		if ($stmt = $conn->prepare($query)) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while($r = mysqli_fetch_assoc($result)) {
					$rows[] = $r;
				}
				return $rows;
			} else {
				return NULL;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	function postBalanceIdx($expertUserID) {
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $_POST["userID"])) {
			if ($stmt = $conn->prepare("INSERT INTO BalanceIndexes (userID, timeUpdated, dateFrom, dateTo, value) VALUES (?, UTC_TIMESTAMP(), ?, ?, ?);")) {
				$stmt->bind_param("issd", $_POST["userID"], $_POST["dateFrom"], $_POST["dateTo"], $_POST["balanceIdx"]);
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

	function putBalanceIdx($balanceIdx, $balanceIndexID, $expertUserID) {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT userID FROM BalanceIndexes WHERE balanceIndexID = ?;")) {
			$stmt->bind_param("i", $balanceIndexID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				if (checkExpertSeniorLink($conn, $expertUserID, $row["userID"])) {

					if ($stmt = $conn->prepare("UPDATE BalanceIndexes SET timeUpdated=UTC_TIMESTAMP(), value=? WHERE balanceIndexID=?;")) {
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
?>