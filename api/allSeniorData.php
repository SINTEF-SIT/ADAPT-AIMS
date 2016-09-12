<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/seniorUserDataFunctions.php');
	include('dbFunctions/settingsFunctions.php');
	include('dbFunctions/newestChangeTimeFunctions.php');
	include('dbFunctions/balanceIdxFunctions.php');
	include('dbFunctions/activityIdxFunctions.php');
	include('dbFunctions/feedbackFunctions.php');
	include('dbFunctions/exerciseGroupsFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get data about a senior user from DB
				if (isset($_GET["seniorUserID"])) {
					$seniorUserID = $_GET["seniorUserID"];
					
					$seniorUserDetails = getSeniorUserData($tokenUserID, $seniorUserID);


					if (empty($seniorUserDetails)) {
						deliver_response(200, "Senior user data was not found.", NULL);
					} else {
						$settings = getSettings();
						$newestChangeTime = getNewestChangeTime($tokenUserID, $seniorUserID);

						$balanceIndexes = getBalanceIdx($tokenUserID, $seniorUserID);
						$activityIndexes = getActivityIdx($tokenUserID, $seniorUserID);
						
						$newestBI = ($balanceIndexes !== null) ? end($balanceIndexes).value : null;
						$newestAI = ($activityIndexes !== null) ? end($activityIndexes).value : null;

						$feedback = null;
						if ($newestBI !== null && $newestAI !== null) {
							$feedback = getFeedback($tokenUserID, $seniorUserID, 0, $newestBI, $newestAI);
						}

						$exerciseGroups = getExerciseGroups();

						$res = [
							"seniorUserDetails" => $seniorUserDetails,
							"settings" => $settings,
							"newestChangeTime" => $newestChangeTime,
							"activityIndexes" => $activityIndexes,
							"balanceIndexes" => $balanceIndexes,
							"feedback" => $feedback,
							"exerciseGroups" => $exerciseGroups,
						];

						deliver_response(200, "Data found", $res);
					}
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