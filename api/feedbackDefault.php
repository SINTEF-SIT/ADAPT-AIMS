<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/feedbackDefaultFunctions.php');
	include('dbFunctions/feedbackCustomFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get default feedback messages
				$res = null;

				if (isset($_GET["getAll"])) {
					$res = getAllFeedbackDefault();
				} else if (isset($_GET["category"]) && isset($_GET["idx"])) {
					$AIFeedbackType = (isset($_GET["AIFeedbackType"])) ? $_GET["AIFeedbackType"] : null;
					$res = getFeedbackDefault($_GET["category"], $_GET["idx"], $AIFeedbackType);
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parametre.", NULL);
				}

				if (empty($res)) {
					deliver_response(200, "Ingen feedback-meldinger ble funnet", NULL);
				} else {
					deliver_response(200, "Feedback funnet.", $res);
				}
				break;

			case 'POST':
				// Update a default feedback message
				parse_str(file_get_contents('php://input'), $_POST);

				$successCounter = 0;
				$totalCounter = 0;

				$res = [];

				foreach ($_POST as $key => $value) {
					if (strstr($key, 'msg')) {
						$keywords = preg_split("/-/", $key);
						$msgID = $keywords[1];
						$feedbackText = $value;

						$oldRecord = getSingleFeedbackDefault($msgID);
						$oldFeedbackText = $oldRecord["feedbackText"];
						
						$category = $oldRecord["category"];
						$idx = $oldRecord["idx"];

						if ($oldRecord["category"] === 1) { // BI
							$balanceExerciseKey = "balanceExercise-" . $msgID;
							$strengthExerciseKey = "strengthExercise-" . $msgID;
							if (isset($_POST[$balanceExerciseKey]) && isset($_POST[$strengthExerciseKey])) {
								$balanceExerciseID = (int) $_POST[$balanceExerciseKey];
								$strengthExerciseID = (int) $_POST[$strengthExerciseKey];

								$oldBalanceExerciseID = $oldRecord["balanceExerciseID"];
								$oldStrengthExerciseID = $oldRecord["strengthExerciseID"];

								if (($oldFeedbackText !== $feedbackText) || ($oldBalanceExerciseID !== $balanceExerciseID) || ($oldStrengthExerciseID !== $strengthExerciseID)) { // Changes have been made
									$totalCounter++;
									$newMsgID = postFeedbackDefault($feedbackText, $category, $idx, null, $balanceExerciseID, $strengthExerciseID);
									if ($newMsgID !== null) {
										$successCounter++;
										$newRecord = getSingleFeedbackDefault($newMsgID);
										$res[] = array("oldRecord" => $oldRecord, "newRecord" => $newRecord);

										detactivateCustomFeedbackForAll($category, null);
										setEndTimeCustomFeedbackLog($category, null);

									}
								}
							}
						} else { // AI
							$AIFeedbackType = $oldRecord["AIFeedbackType"];
							if ($oldFeedbackText !== $feedbackText) { // Feedback text has changed
								$totalCounter++;
								$newMsgID = postFeedbackDefault($feedbackText, $category, $idx, $AIFeedbackType, null, null);
								if ($newMsgID !== null) {
									$successCounter++;
									$newRecord = getSingleFeedbackDefault($newMsgID);
									$res[] = array("oldRecord" => $oldRecord, "newRecord" => $newRecord);

									detactivateCustomFeedbackForAll($category, $AIFeedbackType);
									setEndTimeCustomFeedbackLog($category, $AIFeedbackType);
								}
							}
						}
					}
				}
				if ($successCounter === $totalCounter) {
					deliver_response(200, $totalCounter . " råd/tips ble oppdatert.", $res);
				} else {
					deliver_response(200, "Det oppstod en feil, " . ($totalCounter-$successCounter) . " av " . $totalCounter . " råd/tips ble ikke lagret.", null);
				}

				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET, POST", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
		
?>