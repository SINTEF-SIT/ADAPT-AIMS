<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($userID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT feedbackText, timeCreated, category FROM FeedbackMsgCustom WHERE userID=? ORDER BY timeCreated DESC;")) {
			$stmt->bind_param("i", $userID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
					$r["feedbackText"] = decrypt($r["feedbackText"]);
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

	$validToken = validateToken();

	if ($validToken == true) {
		if (isset($_GET["userID"])) {
			$userID = $_GET["userID"];

			$res = readDB($userID);

			if (empty($res)) {
				deliver_response(200, "Ingen feedback-meldinger funnet for bruker-ID = " . $userID, NULL);
			} else {
				deliver_response(200, "Feedback funnet.", $res);
			}
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
		
?>