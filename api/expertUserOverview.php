<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function getData() {
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

	$tokenAdminUserID = validateToken();

	if ($tokenAdminUserID === 0) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get all expert users and the ID's of their connected senior users
				$expertUsers = getData();

				if (empty($expertUsers)) {
					deliver_response(200, "No results found.", NULL);
				} else {
					deliver_response(200, "Expert users found.", $expertUsers);
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