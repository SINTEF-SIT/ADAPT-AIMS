<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB($expertUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT u.userID, u.firstName, u.lastName, su.birthDate FROM Users AS u INNER JOIN SeniorUsers AS su ON u.userID = su.userID INNER JOIN ExpertSeniorLink AS esl ON esl.seniorUserID = su.userID WHERE su.active = 1 AND esl.expertUserID = ?;")) {
			$stmt->bind_param("i", $expertUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while($r = mysqli_fetch_assoc($result)) {
					
					$r["firstName"] = decrypt($r["firstName"]);
					$r["lastName"] = decrypt($r["lastName"]);
					$r["birthDate"] = decrypt($r["birthDate"]);
					
					$userID = $r["userID"];

					if ($stmt2 = $conn->prepare("SELECT value FROM MobilityIndexes WHERE userID=? ORDER BY timeDataCollected DESC LIMIT 1;")) {
						$stmt2->bind_param("i", $userID);
						$stmt2->execute();
						$mobilityIdxResult = $stmt2->get_result();
						
						$stmt2->close();

						if (mysqli_num_rows($mobilityIdxResult) > 0) {
							$rowMI = mysqli_fetch_assoc($mobilityIdxResult);
							$MI = $rowMI["value"];
							$r["mobilityIdx"] = $MI;
						} else {
							$r["mobilityIdx"] = null;
						}
					} else {
						return false;
					}

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

	$validToken = validateToken();

	if ($validToken == true) {
		if (isset($_GET["expertUserID"])) {
			$expertUserID = $_GET["expertUserID"];

			$seniorUsers = readDB($expertUserID);

			if (empty($seniorUsers)) {
				deliver_response(200, "No results found.", NULL);
			} else {
				deliver_response(200, "Senior users found. Deccrypted birth date: " . $test, $seniorUsers);
			}
		} else {
			deliver_response(400, "Invalid request.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>