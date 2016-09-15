<?php
	function getNewestChangeTime($tokenUserID, $seniorUserID) {
		include('inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return null;
			}
		}

		if ($stmt = $conn->prepare("SELECT timeUpdated FROM  ActivityIndexes AS ai WHERE ai.userID = ?
				UNION SELECT timeUpdated FROM BalanceIndexes AS bi WHERE bi.userID = ?
				UNION SELECT timeCreated FROM FeedbackMsgCustom AS fmc WHERE fmc.userID = ?
				ORDER BY timeUpdated DESC LIMIT 1;")) {
			$stmt->bind_param("iii", $seniorUserID, $seniorUserID, $seniorUserID);
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
?>