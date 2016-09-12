<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/feedbackCustomFunctions.php');

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
				if (isset($_POST["userID"]) && isset($_POST["feedbackText"]) && isset($_POST["category"])) {
					$seniorUserID = $_POST["userID"];

					$AIFeedbackType = null;
					if (isset($_POST["AIFeedbackType"])) {
						$AIFeedbackType = $_POST["AIFeedbackType"];
					}

					$msgID = postFeedbackCustom($seniorUserID, $_POST["feedbackText"], $_POST["category"], $AIFeedbackType, $_POST["balanceExerciseID"], $_POST["strengthExerciseID"], $tokenUserID);

					if ($msgID) {
						$res = array(
							"msgID" => $msgID,
							"timeCreated" => date("Y-m-d H:i:s"),
							"feedbackText" => $_POST["feedbackText"],
						);
						deliver_response(200, "Teksten ble vellykket skrevet til databasen for bruker-ID = " . $seniorUserID . ".", $res);
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
					$AIFeedbackType = isset($_GET["AIFeedbackType"]) ? $_GET["AIFeedbackType"] : null;
					$dbWriteSuccess = putFeedbackCustom($tokenUserID, $_GET["seniorUserID"], $_GET["category"], $AIFeedbackType, $_GET["value"]);

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