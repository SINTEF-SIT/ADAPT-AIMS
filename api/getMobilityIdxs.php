<?php
	include('deliver_response.inc.php');

	function readDB($seniorUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT value, timeDataCollected, timeCalculated FROM MobilityIndexes WHERE userID = ? ORDER BY timeDataCollected ASC;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();

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
			return NULL;
		}

		$conn->close();
	}

	header("Content-Type:application/json");

	if (!empty($_GET["seniorUserID"])) {
		$seniorUserID = $_GET["seniorUserID"];

		$mobilityIndexes = readDB($seniorUserID);

		if (empty($mobilityIndexes)) {
			deliver_response(200, "Ingen data er registrert ennå.", NULL);
		} else {
			deliver_response(200, "Mobility index funnet.", $mobilityIndexes);
		}
	} else {
		deliver_response(400, "Ugyldig forespørsel.", NULL);
	}
?>