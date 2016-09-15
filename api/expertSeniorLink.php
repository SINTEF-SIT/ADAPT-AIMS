<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/expertSeniorLinkFunctions.php');

	$tokenAdminUserID = validateToken();

	if ($tokenAdminUserID === 0) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'POST':
				if (isset($_POST["expertUserID"])) {
					$expertUserID = $_POST["expertUserID"];
					
					$dbDeleteSuccess = deleteExpertSeniorLinks($expertUserID);

					if ($dbDeleteSuccess) {

						if (isset($_POST["seniorUserID"])) {
							$seniorUserIDs = $_POST["seniorUserID"];

							$numLinks = count($seniorUserIDs);
							$successCounter = 0;
							for ($i=0; $i<$numLinks; $i++) {
								$dbWriteSuccess = postExpertSeniorLinks($expertUserID, $seniorUserIDs[$i]);
								if ($dbWriteSuccess) $successCounter++;
							}

							if ($successCounter === $numLinks) {
								deliver_response(200, "Endringene ble lagret.", true);
							} else {
								if ($successCounter === 0) {
									deliver_response(200, "ERROR: Gamle koblinger ble slettet, men ingen nye koblinger ble lagret!", NULL);
								} else {
									deliver_response(200, "ERROR: Gamle koblinger ble slettet, men kun " . $successCounter . " av " . $numLinks . " nye koblinger ble lagret!", NULL);
								}
							}
						} else {
							deliver_response(200, "Endringene ble lagret.", true);
						}
					} else {
						deliver_response(200, "ERROR: Kunne ikke slette eksisterende koblinger fra databasen", NULL);
					}
				} else {
					deliver_response(400, "ERROR: Parameter mangler: expertUserID", NULL);
				}
				break;
			default:
				deliver_response(400, "ERROR: Ugyldig forespørsel. Aksepterte forespørsel-typer: POST", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>