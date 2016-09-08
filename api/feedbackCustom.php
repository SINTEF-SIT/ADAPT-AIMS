<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function getData($seniorUserID, $tokenUserID) {
		include('inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				$conn->close();
				return null;
			}
		}

		if ($stmt = $conn->prepare("SELECT msgID, feedbackText, timeCreated, category, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgCustom
				WHERE userID=?
				ORDER BY timeCreated DESC;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
					$r["feedbackText"] = decrypt($r["feedbackText"]);
					$rows[] = $r;
				}
				$conn->close();
				return $rows;
			}
		}
		$conn->close();
		return NULL;
	}

	function postData($seniorUserID, $feedbackText, $category, $balanceExerciseID, $strengthExerciseID, $expertUserID) {
		
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $seniorUserID)) {

			if ($stmt = $conn->prepare("INSERT INTO FeedbackMsgCustom (userID, feedbackText, timeCreated, category, balanceExerciseID, expertUserID) VALUES (?, ?, UTC_TIMESTAMP(), ?, ?, ?);")) {
				$stmt->bind_param("isii", $seniorUserID, encrypt($feedbackText), $category, $balanceExerciseID, $strengthExerciseID);
				$stmt->execute();

				$stmt->close();
				$conn->close();
				return true;
			}
		}
		$conn->close();
		return false;
	}

	function putData($seniorUserID, $category, $value, $tokenUserID) {
		
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID)) {
			
			$query = "UPDATE SeniorUsers SET showPersonalizedAIFeedback=? WHERE userID=?;"; // AI
			if ($category == "1") { // BI
				$query = "UPDATE SeniorUsers SET showPersonalizedBIFeedback=? WHERE userID=?;";
			}

			if ($stmt = $conn->prepare($query)) {
				$stmt->bind_param("ii", $value, $seniorUserID);
				$stmt->execute();
				$stmt->close();
				$conn->close();
				return true;
			}
		}
		$conn->close();
		return false;
	}


	function deleteData($msgID) {
		
		include('inc/db.inc.php');

		$query = "DELETE FROM FeedbackMsgCustom WHERE msgID=?";

		if ($stmt = $conn->prepare($query)) {
			$stmt->bind_param("i", $msgID);
			$stmt->execute();
			$stmt->close();
			$conn->close();
			return true;
		} else {
			return false;
		}
	}



	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get personalized feedback messages to a senior user
				if (isset($_GET["seniorUserID"])) {
					$res = getData($_GET["seniorUserID"], $tokenUserID);

					if (empty($res)) {
						deliver_response(200, "Ingen feedback-meldinger er lagret i databasen.", NULL);
					} else {
						deliver_response(200, "Feedback funnet.", $res);
					}
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parameter.", NULL);
				}
				break;


			case 'POST':
				// Store a new personalized feedback message for a senior user in DB
				if (isset($_POST["userID"]) && isset($_POST["feedbackText"]) && isset($_POST["category"])) {
					$seniorUserID = $_POST["userID"];

					$dbWriteSuccess = postData($seniorUserID, $_POST["feedbackText"], $_POST["category"], $_POST["balanceExerciseID"], $_POST["strengthExerciseID"], $tokenUserID);

					if ($dbWriteSuccess) {
						deliver_response(200, "Teksten ble vellykket skrevet til databasen for bruker-ID = " . $seniorUserID . ".", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig POST-forespørsel: mangler parametre.", NULL);
				}
				break;


			case 'PUT':
				// Edit a personalized feedback message for a senior user in DB

				if (isset($_GET["seniorUserID"]) && isset($_GET["category"]) && isset($_GET["value"])) {
					$dbWriteSuccess = putData($_GET["seniorUserID"], $_GET["category"], $_GET["value"], $tokenUserID);

					if ($dbWriteSuccess) {
						deliver_response(200, "Opplysningene ble lagret i databasen.", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig PUT-forespørsel: mangler parametre.", NULL);
				}
				break;

			case 'DELETE':
				// Deletes a custom feedback message
				if (isset($_GET["msgID"])) {
					$dbWriteSuccess = deleteData($_GET["msgID"]);

					if ($dbWriteSuccess) {
						deliver_response(200, "Rådet ble slettet fra databasen.", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig DELETE-forespørsel: mangler parameter.", NULL);
				}
				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET, POST, PUT, DELETE", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
		
?>