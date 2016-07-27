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

		if ($stmt = $conn->prepare("SELECT value, timeDataCollected, timeCalculated
				FROM ActivityIndexes
				WHERE userID=?
				ORDER BY timeDataCollected DESC LIMIT 1;")) {
			$stmt->bind_param("i", $seniorUserID);
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

	if ($tokenUserID != null) {
		if (isset($_GET["seniorUserID"])) {
			
			$mobilityIndex = readDB($_GET["seniorUserID"], $tokenUserID);

			if (empty($mobilityIndex)) {
				deliver_response(200, "Ingen data er registrert ennå.", NULL);
			} else {
				deliver_response(200, "Activity index funnet.", $mobilityIndex);
			}
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>