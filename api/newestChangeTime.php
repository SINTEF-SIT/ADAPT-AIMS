<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function getData($seniorUserID, $tokenUserID) {
		include('../inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return null;
			}
		}

		if ($stmt = $conn->prepare("SELECT timeCalculated FROM MobilityIndexes AS mi WHERE mi.userID = ?
				UNION SELECT timeCalculated FROM ActivityIndexes AS ai WHERE ai.userID = ?
				UNION SELECT timeCalculated FROM BalanceIndexes AS bi WHERE bi.userID = ?
				UNION SELECT timeCreated FROM FeedbackMsgCustom AS fmc WHERE fmc.userID = ?
				ORDER BY timeCalculated DESC LIMIT 1;")) {
			$stmt->bind_param("iiii", $seniorUserID, $seniorUserID, $seniorUserID, $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				return mysqli_fetch_assoc($result);
			} else {
				return NULL;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get the most recent timeCalculated value for either MI, AI, BI or custom feedback.
				if (isset($_GET["seniorUserID"])) {
					
					$time = getData($_GET["seniorUserID"], $tokenUserID);

					if (empty($time)) {
						deliver_response(200, "Ingen data er registrert ennå.", NULL);
					} else {
						deliver_response(200, "Timestamp funnet.", $time);
					}
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parameter.", NULL);
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