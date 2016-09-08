<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function getData($seniorUserID, $category, $idx, $tokenUserID) {
		include('inc/db.inc.php');

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
					if ($stmt = $conn->prepare("SELECT * FROM FeedbackMsgCustom
							WHERE category=? AND userID=?
							ORDER BY timeCreated DESC LIMIT 1;")) {
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
					if ($stmt = $conn->prepare("SELECT * FROM FeedbackMsgDefault
						WHERE category=? AND idx=?
						ORDER BY category, idx LIMIT 1;")) {
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

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get current AI or BI feedback message for a senior user (either default or custom)
				if (isset($_GET["seniorUserID"]) && isset($_GET["category"]) && isset($_GET["idx"])) {
					
					$feedbackMsg = getData($_GET["seniorUserID"], $_GET["category"], $_GET["idx"], $tokenUserID);

					if (empty($feedbackMsg)) {
						deliver_response(200, "Ingen råd av denne kategorien er registrert ennå.", NULL);
					} else {
						deliver_response(200, "Råd funnet.", $feedbackMsg);
					}
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parametre.", NULL);
				}
				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET", NULL);
				break;
		}


				
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>