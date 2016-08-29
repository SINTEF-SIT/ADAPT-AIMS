<?php
	include('deliver_response.inc.php');

	function readAdminDB($password) {
		include('../inc/db.inc.php');
		include('../inc/jwt.inc.php');

		$passwordHashed = hashword($password);

		if ($stmt = $conn->prepare("SELECT userID FROM Admin WHERE adminPassword = ?;")) {
			$stmt->bind_param("s", $passwordHashed);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				$row['token'] = generateToken(0);
				$row['isAdmin'] = true;
				$conn->close();
				return $row;
			}
			$conn->close();
		}
		return null;
	}

	function readDB($username, $password) {

		include('../inc/db.inc.php');
		include('../inc/jwt.inc.php');

		$usernameEncrypted = encrypt($username);
		$passwordHashed = hashword($password);

		if ($stmt = $conn->prepare("SELECT userID, firstName, lastName FROM Users WHERE username = ? and password = ? LIMIT 1")) {
			$stmt->bind_param("ss", $usernameEncrypted, $passwordHashed);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$row = mysqli_fetch_assoc($result);
			$userID = $row['userID'];
			$row["firstName"] = decrypt($row["firstName"]);
			$row["lastName"] = decrypt($row["lastName"]);

			if ($userID && is_numeric($userID)) {

				// Search for match in ExpertUsers table
				if ($stmtExpert = $conn->prepare("SELECT userID FROM ExpertUsers WHERE userID = ? LIMIT 1")) {
					$stmtExpert->bind_param("i", $userID);
					$stmtExpert->execute();
					$stmtExpert->store_result();
					$countExpertUsers = $stmtExpert->num_rows;
					
					$stmtExpert->close();
					$conn->close();
					
					if ($countExpertUsers > 0) {
						$row["isExpert"] = true;
					} else {
						$row["isExpert"] = false;
						// Search for match in seniorUsers table
						/*if ($stmtSenior = $conn->prepare("SELECT userID FROM SeniorUsers WHERE userID = ? LIMIT 1")) {
							$stmtSenior->bind_param("i", $userID);
							$stmtSenior->execute();
							$stmtSenior->store_result();
							$countSeniorUsers = $stmtSenior->num_rows;
							
							if ($countSeniorUsers > 0) {
								
							}
						} else {
							$error = "Ugyldig brukernavn/passord";
						}
						$stmtSenior->close();*/
					}

					$row['token'] = generateToken($userID);
					$row['isAdmin'] = false;
					return $row;
				}
				$stmtExpert->close();
			}
			$stmt->close();
		}
		return null;
	}

	if (isset($_POST['username']) && isset($_POST['password'])) {

		$username = $_POST['username'];
		$password = $_POST['password'];

		if ($username == "admin") {
			$userData = readAdminDB($password);
		} else {
			$userData = readDB($username, $password);
		}

		if (empty($userData)) {
			deliver_response(200, "Ugyldig brukernavn/passord.", NULL);
		} else {
			deliver_response(200, "Bruker funnet.", $userData);
		}
	} else {
		deliver_response(400, "Ugyldig forespørsel.", NULL);
	}
?>