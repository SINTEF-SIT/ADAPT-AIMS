<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($seniorUserID, $tokenUserID) {
		include('../inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return null;
			}
		}

		if ($stmt = $conn->prepare("SELECT fmc.feedbackText, fmc.timeCreated, fmc.category, e.*
				FROM FeedbackMsgCustom AS fmc LEFT JOIN Exercises AS e ON fmc.exerciseID = e.exerciseID
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

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {	

		if (isset($_GET["seniorUserID"])) {
			$res = readDB($_GET["seniorUserID"], $tokenUserID);

			if (empty($res)) {
				deliver_response(200, "Ingen feedback-meldinger er lagret i databasen.", NULL);
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