<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($seniorUserID, $category, $idx, $tokenUserID) {
		include('../inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return null;
			}
		}

		if ($stmt1 = $conn->prepare("SELECT showPersonalizedAIFeedback, showPersonalizedBIFeedback
				FROM SeniorUsers WHERE userID=?;")) {
			$stmt1->bind_param("i", $seniorUserID);
			$stmt1->execute();
			$seniorUserTableRes = $stmt1->get_result();
			$stmt1->close();
			if (mysqli_num_rows($seniorUserTableRes) > 0) {
				$seniorUserTableRow = mysqli_fetch_assoc($seniorUserTableRes);
				$personalizedAIFeedback = $seniorUserTableRow["showPersonalizedAIFeedback"];
				$personalizedBIFeedback = $seniorUserTableRow["showPersonalizedBIFeedback"];

				$fetchPersonalizedMsg = false;
				if ($category == '0' && $personalizedAIFeedback == 1 || $category == '1' && $personalizedBIFeedback == 1) {
					$fetchPersonalizedMsg = true;
				}


				if ($fetchPersonalizedMsg) { // Fetch custom, personalized feedback msg
					if ($stmt = $conn->prepare("SELECT fmc.feedbackText, fmc.timeCreated, fmc.category, e.*
							FROM FeedbackMsgCustom AS fmc LEFT JOIN Exercises AS e ON fmc.exerciseID = e.exerciseID
							WHERE fmc.category=? AND userID=?
							ORDER BY timeCreated DESC;")) {
						$stmt->bind_param("ii", $category, $seniorUserID);
						$stmt->execute();
						$result = $stmt->get_result();
						$stmt->close();

						if (mysqli_num_rows($result) > 0) {
							$r = mysqli_fetch_assoc($result);
							$r["feedbackText"] = decrypt($r["feedbackText"]);
							$conn->close();
							return $r;
						}
					}
				} else { // Fetch default feedback msg based on current AI/BI value 
					if ($stmt = $conn->prepare("SELECT fmd.msgID, fmd.feedbackText, fmd.category, e.* 
						FROM FeedbackMsgDefault AS fmd 
						LEFT JOIN Exercises AS e ON fmd.exerciseID = e.exerciseID
						WHERE fmd.category=? AND fmd.idx=?
						ORDER BY fmd.category, fmd.idx LIMIT 1;")) {
						$stmt->bind_param("ii", $category, $idx);
						$stmt->execute();
						$result = $stmt->get_result();
						$stmt->close();
						if (mysqli_num_rows($result) > 0) {
							$conn->close();
							return mysqli_fetch_assoc($result);
						}
					}
				}
			}
		}
		$conn->close();
		return NULL;
	}

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_GET["seniorUserID"]) && isset($_GET["category"]) && isset($_GET["idx"])) {
			
			$feedbackMsg = readDB($_GET["seniorUserID"], $_GET["category"], $_GET["idx"], $tokenUserID);

			if (empty($feedbackMsg)) {
				deliver_response(200, "Ingen råd av denne kategorien er registrert ennå.", NULL);
			} else {
				deliver_response(200, "Råd funnet.", $feedbackMsg);
			}
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>