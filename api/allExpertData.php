<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/seniorUserOverviewFunctions.php');
	include('dbFunctions/seniorUserDataFunctions.php');
	include('dbFunctions/balanceIdxFunctions.php');
	include('dbFunctions/activityIdxFunctions.php');
	include('dbFunctions/feedbackCustomFunctions.php');
	include('dbFunctions/feedbackDefaultFunctions.php');
	include('dbFunctions/exerciseGroupsFunctions.php');
	include('dbFunctions/settingsFunctions.php');

	$tokenExpertUserID = validateToken();

	if ($tokenExpertUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				$seniorUsersOverview = null;
				$seniorUsers = [];

				// Get a summary of user data for all senior users an expert user has access to
				$seniorUsersOverview = getSeniorUserOverview($tokenExpertUserID);

				if (empty($seniorUsersOverview)) {
					deliver_response(200, "No results found.", NULL);
				} else {
					foreach ($seniorUsersOverview as $seniorUserOverview) {
						$seniorUserID = $seniorUserOverview['userID'];
						
						$seniorUserDetails = getSeniorUserData($tokenExpertUserID, $seniorUserID);
						$balanceIndexes = getBalanceIdx($tokenExpertUserID, $seniorUserID);
						$activityIndexes = getActivityIdx($tokenExpertUserID, $seniorUserID);
						$feedbackCustom = getFeedbackCustom($tokenExpertUserID, $seniorUserID);

						$seniorUser = [
							"userData" => $seniorUserDetails,
							"balanceIndexes" => $balanceIndexes,
							"activityIndexes" => $activityIndexes,
							"feedbackCustom" => $feedbackCustom,
						];
						array_push($seniorUsers, $seniorUser);
					}

					$feedbackDefault = [];
					for ($i=0; $i<=5; $i++) { // Loop to get all default feedback messages of category 0 (AI)
						array_push($feedbackDefault, getFeedbackDefault(0, $i, 0));
						array_push($feedbackDefault, getFeedbackDefault(0, $i, 1));
					}
					for ($i=-1; $i<=1; $i++) { // Loop to get all default feedback messages of category 1 (BI)
						array_push($feedbackDefault, getFeedbackDefault(1, $i, null));
					}

					$feedbackDefaultAll = getAllFeedbackDefault();
					$exerciseGroups = getExerciseGroups();
					$settings = getSettings();
					$feedbackCustomLog = getFeedbackCustomLog();

					$res = [
						"seniorUsers" => $seniorUsers,
						"feedbackDefault" => $feedbackDefault,
						"feedbackDefaultAll" => $feedbackDefaultAll,
						"exerciseGroups" => $exerciseGroups,
						"settings" => $settings,
						"feedbackCustomLog" => $feedbackCustomLog,
					];
					deliver_response(200, "Data found", $res);
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