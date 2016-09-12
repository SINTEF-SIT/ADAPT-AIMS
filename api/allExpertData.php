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
				if ($tokenExpertUserID === 0) { // if user is admin
					$seniorUsersOverview = getAllSeniorUserOverviewData();
				} else {
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

						$feedbackDefault = getFeedbackDefault();
						$exerciseGroups = getExerciseGroups();
						$settings = getSettings();

						$res = [
							"seniorUsers" => $seniorUsers,
							"feedbackDefault" => $feedbackDefault,
							"exerciseGroups" => $exerciseGroups,
							"settings" => $settings,
						];
						deliver_response(200, "Data found", $res);
					}
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