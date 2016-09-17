<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/feedbackCustomFunctions.php');
	include('dbFunctions/feedbackFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get personalized feedback messages to a senior user
				if (isset($_GET["seniorUserID"])) {
					$res = getFeedbackCustom($tokenUserID, $_GET["seniorUserID"]);
					
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
				if (isset($_POST["userID"]) && isset($_POST["feedbackText"]) && isset($_POST["category"]) && isset($_POST["customFeedbackOn"])) {
					$seniorUserID = (int) $_POST["userID"];
					$customFeedbackOn = (int) $_POST["customFeedbackOn"];
					$category = (int) $_POST["category"];

					$AIFeedbackType = null;
					if (isset($_POST["AIFeedbackType"])) {
						$AIFeedbackType = (int) $_POST["AIFeedbackType"];
					}

					$logWriteError = false;
					$oldLogMsgID = null;

					if ($customFeedbackOn === 1) {
						$currentCustomFeedbackMsgs = getFeedback($tokenUserID, $seniorUserID, null, null);
						
						if (is_array($currentCustomFeedbackMsgs) || is_object($currentCustomFeedbackMsgs)) {
							foreach ($currentCustomFeedbackMsgs as $currentCustomFeedbackMsg) {
								// Find the newest custom feedback message matching the category and (if category=AI) AIFeedbackType of the submitted msg
								if ($currentCustomFeedbackMsg["category"] === $category && $currentCustomFeedbackMsg["AIFeedbackType"] === $AIFeedbackType) {
									$oldLogMsgID = $currentCustomFeedbackMsg["msgID"];
									$logWriteSuccess = logCustomFeedback($oldLogMsgID, false); // Set the current time as the expiration time of the last feedback msg
									if (!$logWriteSuccess) $logWriteError = true;
									break;
								}
							}
						}
					}

					$comment = (isset($_POST["comment"]) && $_POST["comment"] !== "") ? $_POST["comment"] : null;

					$msgID = postFeedbackCustom($seniorUserID, $_POST["feedbackText"], $_POST["category"], $AIFeedbackType, $_POST["balanceExerciseID"], $_POST["strengthExerciseID"], $tokenUserID, $comment);

					if ($msgID) {
						if ($customFeedbackOn === 1) { // Store msg in log if custom feedback is turned on for this category
							logCustomFeedback($msgID, true);
						}

						$res = array(
							"msgID" => $msgID,
							"timeCreated" => date("Y-m-d H:i:s"),
							"feedbackText" => $_POST["feedbackText"],
							"oldLogMsgID" => $oldLogMsgID,
						);
						if ($logWriteError) {
							deliver_response(200, "Det oppstod en feil under skriving til FeedbackMsgCustomLog.", $res);
						} else {
							deliver_response(200, "Teksten ble vellykket skrevet til databasen for bruker-ID = " . $seniorUserID . ".", $res);
						}
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", NULL);
					}
				} else {
					deliver_response(400, "Ugyldig POST-forespørsel: mangler parametre.", NULL);
				}
				break;


			case 'PUT':
				// Edit a personalized feedback message for a senior user in DB

				if (isset($_GET["seniorUserID"]) && isset($_GET["category"]) && isset($_GET["value"])) {
					$category = (int) $_GET["category"];
					$AIFeedbackType = isset($_GET["AIFeedbackType"]) ? (int) $_GET["AIFeedbackType"] : null;
					$dbWriteSuccess = putFeedbackCustom($tokenUserID, $_GET["seniorUserID"], $category, $AIFeedbackType, $_GET["value"]);

					if ($dbWriteSuccess) {
						// Set expiration date to the current custom feedback message
						$currentCustomFeedbackMsgs = getFeedback($tokenUserID, $_GET["seniorUserID"], null, null);
						$newRecord = ((int) $_GET["value"] === 1);
						$msgID = null;
						
						if (is_array($currentCustomFeedbackMsgs) || is_object($currentCustomFeedbackMsgs)) {
							foreach ($currentCustomFeedbackMsgs as $currentCustomFeedbackMsg) {
								if ($currentCustomFeedbackMsg["category"] === $category && $currentCustomFeedbackMsg["AIFeedbackType"] === $AIFeedbackType) {
									$msgID = $currentCustomFeedbackMsg["msgID"];
									
									logCustomFeedback($msgID, $newRecord);

									$res = array(
										"msgID" => $msgID,
										"timestamp" => date("Y-m-d H:i:s"),
									);

									deliver_response(200, "Opplysningene ble lagret i databasen.", $res);
									break;
								}
							}
						} else {
							deliver_response(200, "Verdien for å vise personaliserte meldinger ble lagret, men loggføring feilet.", NULL);
						}
					} else {
						deliver_response(200, "Det oppstod en feil under skriving til databasen.", NULL);
					}
				} else {
					deliver_response(400, "Ugyldig PUT-forespørsel: mangler parametre.", NULL);
				}
				break;

			case 'DELETE':
				// Deletes a custom feedback message
				if (isset($_GET["msgID"])) {
					$dbWriteSuccess = deleteFeedbackCustom($_GET["msgID"]);

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