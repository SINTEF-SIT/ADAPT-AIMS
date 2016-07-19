<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($seniorUserID, $category, $tokenUserID) {
		include('../inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return false;
			}
		}

		if ($stmt = $conn->prepare("SELECT feedbackText, timeCreated
				FROM FeedbackMsgCustom
				WHERE userID=? AND category=?
				ORDER BY timeCreated DESC LIMIT 1;")) {
			$stmt->bind_param("ii", $seniorUserID, $category);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				$row["feedbackText"] = decrypt($row["feedbackText"]);
				return $row;
			} else {
				return NULL;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID !=  null) {
		if (isset($_GET["seniorUserID"]) && isset($_GET["category"])) {
			
			$feedbackMsg = readDB($_GET["seniorUserID"], $_GET["category"], $tokenUserID);

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