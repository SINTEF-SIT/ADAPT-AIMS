<?php
	function getActivityIdx($tokenUserID, $seniorUserID) {
		include('inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return NULL;
			}
		}

		$query = "SELECT activityIndexID, value, timeDataCollected, timeCalculated
				FROM ActivityIndexes
				WHERE userID=? 
				ORDER BY timeDataCollected ";

		if (isset($_GET["getNewest"])) {
			// Get the newest activity index for a user
			$query .= "DESC LIMIT 1;";
		} else {
			// Get all activity indexes for a user
			$query .= "ASC;";
		}

		if ($stmt = $conn->prepare($query)) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				if (isset($_GET["getNewest"])) {
					return mysqli_fetch_assoc($result);
				} else {
					$rows = array();
					while($r = mysqli_fetch_assoc($result)) {
						$rows[] = $r;
					}
					return $rows;
				}
			} else {
				return NULL;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	function postActivityIdx($expertUserID) {
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $_POST["userID"])) {
			if ($stmt = $conn->prepare("INSERT INTO ActivityIndexes (userID, timeCalculated, timeDataCollected, value) VALUES (?, UTC_TIMESTAMP(), ?, ?);")) {
				$stmt->bind_param("isd", $_POST["userID"], $_POST["timeDataCollected"], $_POST["activityIdx"]);
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

	function putActivityIdx($activityIdx, $activityIndexID, $expertUserID) {
		include('inc/db.inc.php');

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
?>