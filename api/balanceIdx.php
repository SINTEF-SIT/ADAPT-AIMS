<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/balanceIdxFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {
		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get the newest balance index from DB
				if (isset($_GET["seniorUserID"])) {
					$balanceIndexes = getBalanceIdx($tokenUserID, $_GET["seniorUserID"]);

					if (empty($balanceIndexes)) {
						deliver_response(200, "Ingen data er registrert ennå.", NULL);
					} else {
						deliver_response(200, "Balance index funnet.", $balanceIndexes);
					}
				} else {
					deliver_response(400, "Ugyldig GET-forespørsel: mangler parameter.", NULL);
				}
				break;


			case 'POST':
				// Write new balance index to DB
				if (isset($_POST["userID"]) && isset($_POST["timeDataCollected"]) && isset($_POST["balanceIdx"])) {
					$dbWriteSuccess = postBalanceIdx($tokenUserID);

					if ($dbWriteSuccess) {
						deliver_response(200, "Verdien " . $_POST["balanceIdx"] . " for bruker-ID=" . $_POST["userID"] . " på dato " . $_POST["timeDataCollected"] . " ble lagret i databasen.", true);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
					}
				} else {
					deliver_response(400, "Ugyldig POST-forespørsel: mangler parametre.", NULL);
				}
				break;


			case 'PUT':
				// Overwrite an balance index value in DB
				parse_str(file_get_contents('php://input'), $_POST );

				$balanceIdx = $_POST["balanceIdx"];
				$balanceIndexID = $_POST["balanceIndexID"];

				if ($balanceIdx && $balanceIndexID) {
					$dbWriteSuccess = putBalanceIdx($balanceIdx, $balanceIndexID, $tokenUserID);

					if ($dbWriteSuccess) {
						deliver_response(200, "Verdien BI=" . $balanceIdx . " ble lagret i databasen.", true);
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