<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($seniorUserID, $tokenUserID) {
		include('../inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return false;
			}
		}

		if ($stmt = $conn->prepare("SELECT balanceIndexID, value, timeDataCollected, timeCalculated
				FROM BalanceIndexes
				WHERE userID=?
				ORDER BY timeDataCollected ASC;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while($r = mysqli_fetch_assoc($result)) {
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

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_GET["seniorUserID"])) {
			
			$mobilityIndexes = readDB($_GET["seniorUserID"], $tokenUserID);

			if (empty($mobilityIndexes)) {
				deliver_response(200, "Ingen data er registrert ennå.", NULL);
			} else {
				deliver_response(200, "Balance index funnet.", $mobilityIndexes);
			}
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>