<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($mi, $ai) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT feedbackText FROM FeedbackMsgDefault WHERE mobilityIdxCorrespond=? AND activityIdxCorrespond=?;")) {
			$stmt->bind_param("ii", $mi, $ai);
			$stmt->execute();
			$result = $stmt->get_result();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				$row["feedbackText"] = decrypt($row["feedbackText"]);
				return $row;
			} else {
				return NULL;
			}
		} else {
			return NULL;
		}

		$conn->close();
	}

	$validToken = validateToken();

	if ($validToken == true) {
		if (isset($_GET["mi"]) && isset($_GET["ai"])) {
			$mi = $_GET["mi"];
			$ai = $_GET["ai"];

			$res = readDB($mi, $ai);

			if (empty($res)) {
				deliver_response(200, "Ingen feedback-melding funnet for denne kombinasjonen av AI=" . $ai . " og MI=" . $mi, NULL);
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