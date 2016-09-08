<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function getData() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT msgID, feedbackText, category, idx, AIFeedbackType, balanceExerciseID, strengthExerciseID
				FROM FeedbackMsgDefault;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
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

	function putData($msgID, $balanceExerciseID, $strengthExerciseID, $feedbackText) {
		
		include('inc/db.inc.php');
			
		if ($stmt = $conn->prepare("UPDATE FeedbackMsgDefault SET feedbackText=?, balanceExerciseID=?, strengthExerciseID=? WHERE msgID=?;")) {
			$stmt->bind_param("siii", $feedbackText, $balanceExerciseID, $strengthExerciseID, $msgID);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return true;
		} else {
			$conn->close();
			return false;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get default feedback messages
				$res = getData();

				if (empty($res)) {
					deliver_response(200, "Ingen feedback-meldinger er lagret i databasen.", NULL);
				} else {
					deliver_response(200, "Feedback funnet.", $res);
				}
				break;

			case 'PUT':
				// Update a default feedback message
				parse_str(file_get_contents('php://input'), $_POST);

				$successCounter = 0;
				$totalCounter = 0;

				foreach ($_POST as $key => $value) {
					if (strstr($key, 'msg')) {
						$keywords = preg_split("/-/", $key);
						$msgID = $keywords[1];
						$feedbackText = $value;
						$balanceExerciseKey = "balanceExercise-" . $msgID;
						$strengthExerciseKey = "strengthExercise-" . $msgID;
						if (isset($_POST[$balanceExerciseKey]) && isset($_POST[$strengthExerciseKey])) {
							$balanceExerciseID = $_POST[$balanceExerciseKey];
							$strengthExerciseID = $_POST[$strengthExerciseKey];

							$dbWriteSuccess = putData($msgID, $balanceExerciseID, $strengthExerciseID, $feedbackText);
							if ($dbWriteSuccess) {
								$successCounter++;
							}
						}
						$totalCounter++;
					}
				}
				if ($successCounter === $totalCounter) {
					deliver_response(200, $totalCounter . " råd/tips ble oppdatert.", true);
				} else {
					deliver_response(200, "Det oppstod en feil, " . $totalCounter . " av " . $successCounter . " råd/tips ble ikke oppdatert.", false);
				}

				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET, PUT", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
		
?>