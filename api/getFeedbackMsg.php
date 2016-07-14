<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($seniorUserID, $category) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT feedbackText, timeCreated FROM FeedbackMsgCustom WHERE userID=? AND category=? ORDER BY timeCreated DESC LIMIT 1;")) {
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

	$validToken = validateToken();

	if ($validToken == true) {
		if (isset($_GET["seniorUserID"]) && isset($_GET["category"])) {
			$seniorUserID = $_GET["seniorUserID"];
			$category = $_GET["category"];

			$feedbackMsg = readDB($seniorUserID, $category);

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