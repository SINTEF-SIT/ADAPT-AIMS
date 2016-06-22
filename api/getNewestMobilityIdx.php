<?php
	include('deliver_response.inc.php');

	function readDB($seniorUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT value, timeDataCollected, timeCalculated FROM `MobilityIndexes` WHERE userID=? ORDER BY timeDataCollected DESC LIMIT 1;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();

			if (mysqli_num_rows($result) > 0) {
				return mysqli_fetch_assoc($result);
			} else {
				return NULL;
			}
		} else {
			return NULL;
		}

		$conn->close();
	}

	header("Content-Type:application/json");

	if (!empty($_GET["seniorUserID"])) {
		$seniorUserID = $_GET["seniorUserID"];

		$mobilityIndex = readDB($seniorUserID);

		if (empty($mobilityIndex)) {
			deliver_response(200, "Ingen data er registrert ennå.", NULL);
		} else {
			deliver_response(200, "Mobility index funnet.", $mobilityIndex);
		}
	} else {
		deliver_response(400, "Ugyldig forespørsel.", NULL);
	}
?>