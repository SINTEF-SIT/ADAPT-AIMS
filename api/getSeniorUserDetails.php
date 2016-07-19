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

		if ($stmt = $conn->prepare("SELECT u.userID, u.firstName, u.lastName, u.email, 
				su.address, su.zipCode, su.city, su.phoneNumber, su.birthDate, su.isMale, 
				su.weight, su.height, su.numFalls6Mths, su.numFalls12Mths, su.usesWalkingAid, 
				su.livingIndependently, su.dateJoinedAdapt
				FROM Users AS u
				INNER JOIN SeniorUsers AS su ON u.userID = su.userID
				WHERE u.userID = ?;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {

					if ($r["firstName"] != null) $r["firstName"] = decrypt($r["firstName"]);
					if ($r["lastName"] != null) $r["lastName"] = decrypt($r["lastName"]);
					if ($r["email"] != null) $r["email"] = decrypt($r["email"]);
					if ($r["address"] != null) $r["address"] = decrypt($r["address"]);
					if ($r["zipCode"] != null) $r["zipCode"] = decrypt($r["zipCode"]);
					if ($r["city"] != null) $r["city"] = decrypt($r["city"]);
					if ($r["phoneNumber"] != null) $r["phoneNumber"] = decrypt($r["phoneNumber"]);
					if ($r["birthDate"] != null) $r["birthDate"] = decrypt($r["birthDate"]);

					$userID = $r["userID"];

					if ($stmt2 = $conn->prepare("SELECT value, timeDataCollected FROM MobilityIndexes WHERE userID=? ORDER BY timeDataCollected DESC LIMIT 1;")) {
						$stmt2->bind_param("i", $userID);
						$stmt2->execute();
						$mobilityIdxResult = $stmt2->get_result();
						
						$stmt2->close();

						if (mysqli_num_rows($mobilityIdxResult) > 0) {
							$rowMI = mysqli_fetch_assoc($mobilityIdxResult);
							$r["mobilityIdx"] = $rowMI["value"];
							$r["mobilityIdxTimeDataCollected"] = $rowMI["timeDataCollected"];
						} else {
							$r["mobilityIdx"] = null;
							$r["mobilityIdxTimeDataCollected"] = null;
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

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_GET["seniorUserID"])) {
			
			$seniorUserDetails = readDB($_GET["seniorUserID"], $tokenUserID);

			if (empty($seniorUserDetails)) {
				deliver_response(200, "No results found.", NULL);
			} else {
				deliver_response(200, "Senior user details found.", $seniorUserDetails);
			}
		} else {
			deliver_response(400, "Invalid request.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>