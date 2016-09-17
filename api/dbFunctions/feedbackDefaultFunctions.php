<?php
	function getFeedbackDefault($category, $idx, $AIFeedbackType) {
		include('inc/db.inc.php');

		$query = "SELECT * FROM FeedbackMsgDefault 
			WHERE category=? AND idx=? ";
		if ($AIFeedbackType !== null) {
			$query .= "AND AIFeedbackType=? ";
		}
		$query .= "ORDER BY timeCreated DESC LIMIT 1;";

		if ($stmt = $conn->prepare($query)) {
			if ($AIFeedbackType !== null) {
				$stmt->bind_param("iii", $category, $idx, $AIFeedbackType);
			} else {
				$stmt->bind_param("ii", $category, $idx);
			}
			
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$conn->close();
				return mysqli_fetch_assoc($result);
			}
		}
		$conn->close();
		return NULL;
	}

	function getSingleFeedbackDefault($msgID) {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT * FROM FeedbackMsgDefault WHERE msgID=?;")) {
			$stmt->bind_param("i", $msgID);

			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$conn->close();
				return mysqli_fetch_assoc($result);
			}
		}
		$conn->close();
		return NULL;
	}

	function getAllFeedbackDefault() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT * FROM FeedbackMsgDefault ORDER BY timeCreated ASC;")) {
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
			} else {
				$conn->close();
				return NULL;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	function putFeedbackDefault($msgID, $balanceExerciseID, $strengthExerciseID, $feedbackText) {
		
		include('inc/db.inc.php');
			
		if ($stmt = $conn->prepare("UPDATE FeedbackMsgDefault SET feedbackText=?, balanceExerciseID=?, strengthExerciseID=? WHERE msgID=?;")) {
			$stmt->bind_param("siii", $feedbackText, $balanceExerciseID, $strengthExerciseID, $msgID);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return true;
		} else {
			$conn->close();
			return false;
		}
	}

	function postFeedbackDefault($feedbackText, $category, $idx, $AIFeedbackType, $balanceExerciseID, $strengthExerciseID) {
		include('inc/db.inc.php');
		$query = "INSERT INTO FeedbackMsgDefault (timeCreated, feedbackText, category, idx, ";
		if ($category === 0) { // AI
			$query .= "AIFeedbackType) VALUES (UTC_TIMESTAMP(), ?, ?, ?, ?);";
		} else { // BI
			$query .= "balanceExerciseID, strengthExerciseID) VALUES (UTC_TIMESTAMP(), ?, ?, ?, ?, ?);";
		}

		if ($stmt = $conn->prepare($query)) {
			if ($category === 0) { // AI
				$stmt->bind_param("siii", $feedbackText, $category, $idx, $AIFeedbackType);
			} else { // BI
				$stmt->bind_param("siiii", $feedbackText, $category, $idx, $balanceExerciseID, $strengthExerciseID);
			}
			
			$stmt->execute();
			$msgID = (int) mysqli_insert_id($conn);

			$stmt->close();
			$conn->close();
			return $msgID;
		} else {
			$conn->close();
			return null;
		}
	}
?>