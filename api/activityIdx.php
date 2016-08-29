<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function getData($seniorUserID, $tokenUserID) {
		include('../inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return NULL;
			}
		}

		$query = "SELECT activityIndexID, value, timeDataCollected, timeCalculated
				FROM ActivityIndexes
				WHERE userID=? 
				ORDER BY timeDataCollected ";

		if (isset($_GET["getNewest"])) {
			// Get the newest activity index for a user
			$query .= "DESC LIMIT 1;";
		} else {
			// Get all activity indexes for a user
			$query .= "ASC;";
		}

		if ($stmt = $conn->prepare($query)) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				if (isset($_GET["getNewest"])) {
					return mysqli_fetch_assoc($result);
				} else {
					$rows = array();
					while($r = mysqli_fetch_assoc($result)) {
						$rows[] = $r;
					}
					return $rows;
				}
			} else {
				return NULL;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	function postData($expertUserID) {
		include('../inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $_POST["userID"])) {
			if ($stmt = $conn->prepare("INSERT INTO ActivityIndexes (userID, timeCalculated, timeDataCollected, value) VALUES (?, UTC_TIMESTAMP(), ?, ?);")) {
				$stmt->bind_param("isi", $_POST["userID"], $_POST["timeDataCollected"], $_POST["activityIdx"]);
				$stmt->execute();

				$stmt->close();
				$conn->close();
				return true;
			} else {
				$conn->close();
				return false;
			}
		} else {
			return false;
		}
	}

	function putData($activityIdx, $activityIndexID, $expertUserID) {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT userID FROM ActivityIndexes WHERE activityIndexID = ?;")) {
			$stmt->bind_param("i", $activityIndexID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				if (checkExpertSeniorLink($conn, $expertUserID, $row["userID"])) {

					if ($stmt = $conn->prepare("UPDATE ActivityIndexes SET timeCalculated=UTC_TIMESTAMP(), value=? WHERE activityIndexID=?;")) {
						$stmt->bind_param("di", $activityIdx, $activityIndexID);
						$stmt->execute();

						$stmt->close();
						$conn->close();
						return true;
					}
				}
			}
		}
		$conn->close();
		return false;		
	}



	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {
		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get the newest activity index from DB
				if (isset($_GET["seniorUserID"])) {
					$activityIndex = getData($_GET["seniorUserID"], $tokenUserID);

					if (empty($activityIndex)) {
						deliver_response(200, "Ingen data er registrert ennå.", NULL);
					} else {
						deliver_response(200, "Activity index funnet.", $activityIndex);
					}
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parameter.", NULL);
				}
				break;


			case 'POST':
				// Write new activity index to DB
				if (isset($_POST["userID"]) && isset($_POST["timeDataCollected"]) && isset($_POST["activityIdx"])) {
					$dbWriteSuccess = postData($tokenUserID);

					if ($dbWriteSuccess) {
						deliver_response(200, "Verdien " . $_POST["activityIdx"] . " for bruker-ID=" . $_POST["userID"] . " på dato " . $_POST["timeDataCollected"] . " ble lagret i databasen.", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig POST-forespørsel: mangler parametre.", NULL);
				}
				break;


			case 'PUT':
				// Overwrite an activity index value in DB
				parse_str(file_get_contents('php://input'), $_POST );

				$activityIdx = $_POST["activityIdx"];
				$activityIndexID = $_POST["activityIndexID"];

				if ($activityIdx && $activityIndexID) {
					$dbWriteSuccess = putData($activityIdx, $activityIndexID, $tokenUserID);

					if ($dbWriteSuccess) {
						deliver_response(200, "Verdien AI=" . $activityIdx . " ble lagret i databasen.", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig PUT-forespørsel: mangler parametre.", NULL);
				}
				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET, POST, PUT", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>