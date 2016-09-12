<?php
	function getFeedbackDefault() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT msgID, feedbackText, category, idx, AIFeedbackType, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgDefault;")) {
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
?>