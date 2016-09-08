<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function getData($username) {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT userID FROM Users WHERE username = ?;")) {
			$stmt->bind_param("s", encrypt($username));
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				return $row["userID"];
			} else {
				return -1;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get the most recent timeCalculated value for either MI, AI, BI or custom feedback.
				if (isset($_GET["username"])) {
					$match = getData($_GET["username"]);
					deliver_response(200, "", $match);
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parameter.", NULL);
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