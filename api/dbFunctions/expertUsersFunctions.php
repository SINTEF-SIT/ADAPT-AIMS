<?php
	function getExpertUsers() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT u.userID, u.username, u.firstName, u.lastName
				FROM Users AS u
				INNER JOIN ExpertUsers AS eu ON u.userID = eu.userID;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
					
					$r["username"] = decrypt($r["username"]);
					$r["firstName"] = decrypt($r["firstName"]);
					$r["lastName"] = decrypt($r["lastName"]);
					
					$expertUserID = $r["userID"];

					if ($stmt2 = $conn->prepare("SELECT seniorUserID FROM ExpertSeniorLink WHERE expertUserID=?;")) {
						$stmt2->bind_param("i", $expertUserID);
						$stmt2->execute();
						$expertSeniorLinkResult = $stmt2->get_result();
						$stmt2->close();

						if (mysqli_num_rows($expertSeniorLinkResult) > 0) {
							$rowsSeniorUsers = array();
							while ($seniorUserRow = mysqli_fetch_assoc($expertSeniorLinkResult)) {
								$rowsSeniorUsers[] = $seniorUserRow["seniorUserID"];
							}
							$r["seniorUsers"] = $rowsSeniorUsers;
						} else {
							$r["seniorUsers"] = null;
						}
					} else {
						return NULL;
					}
					$rows[] = $r;
				}
				$conn->close();
				return $rows;
			}
		}
		$conn->close();
		return NULL;
	}

	function postExpertUser($username, $password, $firstName, $lastName) {
		include('inc/db.inc.php');

		if ($stmt1 = $conn->prepare("INSERT INTO Users (username, password, firstName, lastName) VALUES (?,?,?,?)")) {
			$stmt1->bind_param("ssss", encrypt($username), hashword($password), encrypt($firstName), encrypt($lastName));
			$stmt1->execute();

			$expertUserID = (int) mysqli_insert_id($conn);
			$stmt1->close();

			if ($stmt2 = $conn->prepare("INSERT INTO ExpertUsers (userID) VALUES (?)")) {
				$stmt2->bind_param("i", $expertUserID);
				$stmt2->execute();
				$stmt2->close();

				$conn->close();
				return $expertUserID;
			}
		}
		$conn->close();
		return null;
	}
?>