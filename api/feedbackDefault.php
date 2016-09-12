<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/feedbackDefaultFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get default feedback messages
				$res = getFeedbackDefault();

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

							$dbWriteSuccess = putFeedbackDefault($msgID, $balanceExerciseID, $strengthExerciseID, $feedbackText);
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