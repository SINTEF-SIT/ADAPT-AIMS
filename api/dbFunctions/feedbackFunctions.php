<?php
	function getFeedback($tokenUserID, $seniorUserID, $BI, $AI) {
		include('inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				$conn->close();
				return null;
			}
		}

		$query1 = "SELECT * FROM 
				(SELECT 1 AS custom, msgID, feedbackText, timeCreated, category, AIFeedbackType, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgCustom
				WHERE category=1 AND userID=?
				ORDER BY timeCreated DESC LIMIT 1) AS a
				UNION SELECT * FROM
				(SELECT 1 AS custom, msgID, feedbackText, timeCreated, category, AIFeedbackType, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgCustom
				WHERE category=0 AND AIFeedbackType=0 AND userID=?
				ORDER BY timeCreated DESC LIMIT 1) AS b
				UNION SELECT * FROM
				(SELECT 1 AS custom, msgID, feedbackText, timeCreated, category, AIFeedbackType, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgCustom
				WHERE category=0 AND AIFeedbackType=1 AND userID=?
				ORDER BY timeCreated DESC LIMIT 1) AS c;";

		$query2 = "SELECT * FROM
				(SELECT 0 AS custom, msgID, feedbackText, timeCreated, category, AIFeedbackType, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgDefault
				WHERE idx=? AND category=1
				ORDER BY timeCreated DESC LIMIT 1) AS d
				UNION SELECT * FROM
				(SELECT 0 AS custom, msgID, feedbackText, timeCreated, category, AIFeedbackType, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgDefault
				WHERE idx=? AND category=0 AND AIFeedbackType=0
				ORDER BY timeCreated DESC LIMIT 1) AS e
				UNION SELECT * FROM
				(SELECT 0 AS custom, msgID, feedbackText, timeCreated, category, AIFeedbackType, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgDefault
				WHERE idx=? AND category=0 AND AIFeedbackType=1
				ORDER BY timeCreated DESC LIMIT 1) AS f;";

		if ($stmt = $conn->prepare($query1)) {
			$stmt->bind_param("iii", $seniorUserID, $seniorUserID, $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			if (mysqli_num_rows($result) > 0) {
				$array = array();
				while ($row = mysqli_fetch_assoc($result)) {
					$row["feedbackText"] = decrypt($row["feedbackText"]);
					if ($r["internalComment"]) {
						$r["internalComment"] = decrypt($r["internalComment"]);
					}
					$array[] = $row;
				}
			}

			if ($BI === null || $AI === null) {
				$conn->close();
				return $array;
			} else {
				if ($stmt2 = $conn->prepare($query2)) {
					$stmt2->bind_param("iii", $BI, $AI, $AI);
					$stmt2->execute();
					$result = $stmt2->get_result();
					$stmt2->close();
					if (mysqli_num_rows($result) > 0) {
						while ($row = mysqli_fetch_assoc($result)) {
							$r["feedbackText"] = decrypt($r["feedbackText"]);
							$array[] = $row;
						}

						$conn->close();
						return $array;
					}
				}
			}
			
		}
		$conn->close();
		return NULL;
	}
?>