<?php
	include('deliver_response.inc.php');

	function readDB($email, $password) {

		include('../inc/db.inc.php');
		include('../inc/jwt.inc.php');

		$emailEncrypted = encrypt($email);
		$passwordHashed = hashword($password);

		if ($stmt = $conn->prepare("SELECT userID, firstName, lastName FROM Users WHERE email = ? and password = ? LIMIT 1")) {
			$stmt->bind_param("ss", $emailEncrypted, $passwordHashed);
			$stmt->execute();
			$result = $stmt->get_result();
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
					return $row;
				}
				$stmtExpert->close();
			}
			$stmt->close();
		}
	}

	if (isset($_POST['email']) && isset($_POST['password'])) {

		$email = $_POST['email'];
		$password = $_POST['password'];

		$userData = readDB($email, $password);

		if (empty($userData)) {
			deliver_response(200, "Ugyldig epost/passord.", NULL);
		} else {
			deliver_response(200, "Bruker funnet.", $userData);
		}
	} else {
		deliver_response(400, "Ugyldig forespørsel.", NULL);
	}
?>