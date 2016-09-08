<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function getAllData() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT u.userID, u.firstName, u.lastName, su.birthDate
				FROM Users AS u
				INNER JOIN SeniorUsers AS su ON u.userID = su.userID
				WHERE su.active = 1;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
					
					$r["firstName"] = decrypt($r["firstName"]);
					$r["lastName"] = decrypt($r["lastName"]);
					$r["birthDate"] = decrypt($r["birthDate"]);
					
					$userID = $r["userID"];
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

	function getData($expertUserID) {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT u.userID, u.firstName, u.lastName, su.birthDate, su.phoneNumber
				FROM Users AS u
				INNER JOIN SeniorUsers AS su ON u.userID = su.userID
				INNER JOIN ExpertSeniorLink AS esl ON esl.seniorUserID = su.userID
				WHERE su.active = 1 AND esl.expertUserID = ?;")) {
			$stmt->bind_param("i", $expertUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
					
					$r["firstName"] = decrypt($r["firstName"]);
					$r["lastName"] = decrypt($r["lastName"]);
					$r["birthDate"] = decrypt($r["birthDate"]);
					if ($r["phoneNumber"] !== null) $r["phoneNumber"] = decrypt($r["phoneNumber"]);
					
					$userID = $r["userID"];

					if ($stmt2 = $conn->prepare("SELECT value FROM BalanceIndexes WHERE userID=? ORDER BY timeDataCollected DESC LIMIT 1;")) {
						$stmt2->bind_param("i", $userID);
						$stmt2->execute();
						$balanceIdxResult = $stmt2->get_result();
						$stmt2->close();

						if (mysqli_num_rows($balanceIdxResult) > 0) {
							$rowBI = mysqli_fetch_assoc($balanceIdxResult);
							$BI = $rowBI["value"];
							$r["balanceIdx"] = $BI;
						} else {
							$r["balanceIdx"] = null;
						}
					} else {
						return NULL;
					}

					if ($stmt3 = $conn->prepare("SELECT value FROM ActivityIndexes WHERE userID=? ORDER BY timeDataCollected DESC LIMIT 1;")) {
						$stmt3->bind_param("i", $userID);
						$stmt3->execute();
						$activityIdxResult = $stmt3->get_result();
						$stmt3->close();

						if (mysqli_num_rows($activityIdxResult) > 0) {
							$rowAI = mysqli_fetch_assoc($activityIdxResult);
							$AI = $rowAI["value"];
							$r["activityIdx"] = $AI;
						} else {
							$r["activityIdx"] = null;
						}
					} else {
						return NULL;
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

	$tokenExpertUserID = validateToken();

	if ($tokenExpertUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				if ($tokenExpertUserID === 0) { // if user is admin
					$seniorUsers = getAllData();
				} else {
					// Get a summary of user data for all senior users an expert user has access to
					$seniorUsers = getData($tokenExpertUserID);
				}

				if (empty($seniorUsers)) {
					deliver_response(200, "No results found.", NULL);
				} else {
					deliver_response(200, "Senior users found.", $seniorUsers);
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