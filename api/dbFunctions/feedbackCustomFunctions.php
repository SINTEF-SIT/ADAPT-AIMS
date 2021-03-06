<?php
	function getFeedbackCustom($tokenUserID, $seniorUserID) {
		include('inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				$conn->close();
				return null;
			}
		}

		if ($stmt = $conn->prepare("SELECT * FROM FeedbackMsgCustom
				WHERE userID=?
				ORDER BY timeCreated DESC;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
					$r["feedbackText"] = decrypt($r["feedbackText"]);
					if ($r["internalComment"]) {
						$r["internalComment"] = decrypt($r["internalComment"]);
					}
					$rows[] = $r;
				}
				$conn->close();
				return $rows;
			}
		}
		$conn->close();
		return NULL;
	}

	function getFeedbackCustomLog() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT * FROM FeedbackMsgCustomLog
				ORDER BY timeStart DESC;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
					$rows[] = $r;
				}
				$conn->close();
				return $rows;
			}
		}
		$conn->close();
		return NULL;
	}

	function postFeedbackCustom($seniorUserID, $feedbackText, $category, $AIFeedbackType, $balanceExerciseID, $strengthExerciseID, $expertUserID, $comment) {
		
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $seniorUserID)) {
			$comment = ($comment !== null) ? encrypt($comment) : null;

			if ($stmt = $conn->prepare("INSERT INTO FeedbackMsgCustom (userID, feedbackText, timeCreated, category, AIFeedbackType, balanceExerciseID, strengthExerciseID, internalComment) VALUES (?, ?, UTC_TIMESTAMP(), ?, ?, ?, ?, ?);")) {
				$stmt->bind_param("isiiiis", $seniorUserID, encrypt($feedbackText), $category, $AIFeedbackType, $balanceExerciseID, $strengthExerciseID, $comment);
				$stmt->execute();
				$msgID = (int) mysqli_insert_id($conn);
				$stmt->close();
				$conn->close();
				return $msgID;
			}
		}
		$conn->close();
		return null;
	}

	function detactivateCustomFeedbackForAll($category, $AIFeedbackType) {
		
		include('inc/db.inc.php');
			
		$query = "UPDATE SeniorUsers SET showPersonalizedBIFeedback=0;"; // BI
		if ($category === 0) { // AI
			if ($AIFeedbackType === 0) { // Sitting less
				$query = "UPDATE SeniorUsers SET showPersonalizedAISittingFeedback=0;";
			} else { // walking more
				$query = "UPDATE SeniorUsers SET showPersonalizedAIWalkingFeedback=0;";
			}
		}

		if ($stmt = $conn->prepare($query)) {
			$stmt->execute();
			$stmt->close();
			$conn->close();
			return true;
		}

		$conn->close();
		return false;
	}

	function putFeedbackCustom($tokenUserID, $seniorUserID, $category, $AIFeedbackType, $value) {
		
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID)) {
			
			$query = "UPDATE SeniorUsers SET showPersonalizedBIFeedback=? WHERE userID=?;"; // BI
			if ($category === 0) { // AI
				if ($AIFeedbackType === 0) { // Sitting less
					$query = "UPDATE SeniorUsers SET showPersonalizedAISittingFeedback=? WHERE userID=?;";
				} else { // walking more
					$query = "UPDATE SeniorUsers SET showPersonalizedAIWalkingFeedback=? WHERE userID=?;";
				}
			}

			if ($stmt = $conn->prepare($query)) {
				$stmt->bind_param("ii", $value, $seniorUserID);
				$stmt->execute();
				$stmt->close();
				$conn->close();
				return true;
			}
		}
		$conn->close();
		return false;
	}

	function logCustomFeedback($msgID, $newRecord) {
		include('inc/db.inc.php');

		$query = "UPDATE FeedbackMsgCustomLog SET timeEnd=UTC_TIMESTAMP() WHERE msgID=? AND timeEnd IS NULL;";
		if ($newRecord) {
			$query = "INSERT INTO FeedbackMsgCustomLog (msgID, timeStart) VALUES (?, UTC_TIMESTAMP());";
		}

		if ($stmt = $conn->prepare($query)) {
			$stmt->bind_param("i", $msgID);
			$stmt->execute();
			$stmt->close();
			$conn->close();
			return true;
		}
		$conn->close();
		return false;
	}

	function setEndTimeCustomFeedbackLog($category, $AIFeedbackType) {
		include('inc/db.inc.php');

		$query = "UPDATE FeedbackMsgCustomLog, FeedbackMsgCustom
			SET FeedbackMsgCustomLog.timeEnd = UTC_TIMESTAMP()
			WHERE FeedbackMsgCustomLog.msgID = FeedbackMsgCustom.msgID
			AND FeedbackMsgCustomLog.timeEnd IS NULL ";
			"AND FeedbackMsgCustom.category = 1;";
		if ($category === 1) {
			$query .= "AND FeedbackMsgCustom.category = 1;";
		} else {
			if ($AIFeedbackType === 0) { // AI, sitting
				$query .= "AND FeedbackMsgCustom.category = 0 AND FeedbackMsgCustom.AIFeedbackType = 0;";
			} else { // AI, walking
				$query .= "AND FeedbackMsgCustom.category = 0 AND FeedbackMsgCustom.AIFeedbackType = 1;";
			}
		}

		if ($stmt = $conn->prepare($query)) {
			$stmt->execute();
			$stmt->close();
			$conn->close();
			return true;
		}
		$conn->close();
		return false;
	}


	function deleteFeedbackCustom($msgID) {
		
		include('inc/db.inc.php');

		$query = "DELETE FROM FeedbackMsgCustom WHERE msgID=?";

		if ($stmt = $conn->prepare($query)) {
			$stmt->bind_param("i", $msgID);
			$stmt->execute();
			$stmt->close();
			$conn->close();
			return true;
		} else {
			return false;
		}
	}
?>