<?php
	include('deliver_response.inc.php');

	function readDB($expertUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT u.userID, u.firstName, u.lastName, su.birthDate, mi.value AS mobilityIdx FROM Users AS u INNER JOIN SeniorUsers AS su ON u.userID = su.userID INNER JOIN ExpertSeniorLink AS esl ON esl.seniorUserID = su.userID INNER JOIN MobilityIndexes AS mi ON su.userID = mi.userID LEFT JOIN MobilityIndexes AS mi2 ON su.userID = mi2.userID AND mi2.timeDataCollected > mi.timeDataCollected WHERE mi2.timeDataCollected IS NULL AND su.active = 1 AND esl.expertUserID = ?;")) {
			$stmt->bind_param("i", $expertUserID);
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

	if (!empty($_GET["expertUserID"])) {
		$expertUserID = $_GET["expertUserID"];

		$seniorUsers = readDB($expertUserID);

		if (empty($seniorUsers)) {
			deliver_response(200, "No results found.", NULL);
		} else {
			deliver_response(200, "Senior users found.", $seniorUsers);
		}
	} else {
		deliver_response(400, "Invalid request.", NULL);
	}
?>