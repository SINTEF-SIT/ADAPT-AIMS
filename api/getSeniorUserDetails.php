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

		if ($stmt = $conn->prepare("SELECT u.userID, u.firstName, u.lastName, u.email, 
				su.address, su.zipCode, su.city, su.phoneNumber, su.birthDate, su.isMale, 
				su.weight, su.height, su.numFalls3Mths, su.numFalls12Mths, su.usesWalkingAid, 
				su.livingIndependently, su.dateJoinedAdapt, su.showPersonalizedAIFeedback, 
				su.showPersonalizedBIFeedback, su.comment
				FROM Users AS u
				INNER JOIN SeniorUsers AS su ON u.userID = su.userID
				WHERE u.userID = ?;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);

				if ($row["firstName"] != null) $row["firstName"] = decrypt($row["firstName"]);
				if ($row["lastName"] != null) $row["lastName"] = decrypt($row["lastName"]);
				if ($row["email"] != null) $row["email"] = decrypt($row["email"]);
				if ($row["address"] != null) $row["address"] = decrypt($row["address"]);
				if ($row["zipCode"] != null) $row["zipCode"] = decrypt($row["zipCode"]);
				if ($row["city"] != null) $row["city"] = decrypt($row["city"]);
				if ($row["phoneNumber"] != null) $row["phoneNumber"] = decrypt($row["phoneNumber"]);
				if ($row["birthDate"] != null) $row["birthDate"] = decrypt($row["birthDate"]);
				if ($row["comment"] != null) $row["comment"] = decrypt($row["comment"]);

				if ($stmt2 = $conn->prepare("SELECT value, timeDataCollected FROM MobilityIndexes WHERE userID=? ORDER BY timeDataCollected DESC LIMIT 1;")) {
					$stmt2->bind_param("i", $row["userID"]);
					$stmt2->execute();
					$mobilityIdxResult = $stmt2->get_result();
					
					$stmt2->close();

					if (mysqli_num_rows($mobilityIdxResult) > 0) {
						$rowMI = mysqli_fetch_assoc($mobilityIdxResult);
						$row["mobilityIdx"] = $rowMI["value"];
						$row["mobilityIdxTimeDataCollected"] = $rowMI["timeDataCollected"];
					} else {
						$row["mobilityIdx"] = null;
						$row["mobilityIdxTimeDataCollected"] = null;
					}
				} else {
					return NULL;
				}
				
				$conn->close();
				return $row;
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