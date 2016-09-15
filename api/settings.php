<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');
	include('dbFunctions/settingsFunctions.php');

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get settings values
				$res = getSettings();

				if (empty($res)) {
					deliver_response(200, "Ingen innstillinger funnet.", NULL);
				} else {
					deliver_response(200, "Innstillinger funnet.", $res);
				}
				break;

			case 'PUT':
				// Update settings values
				parse_str(file_get_contents('php://input'), $_POST );

				if (isset($_POST["BIThresholdLower"]) && isset($_POST["BIThresholdUpper"]) && isset($_POST["maxXAxisIntervalDays"]) && isset($_POST["BIImgHeader"]) && isset($_POST["BIChartHeader"]) && isset($_POST["AIChartHeader"]) && isset($_POST["BIImgLabelLow"]) && isset($_POST["BIImgLabelHigh"]) && isset($_POST["BIChartSpectrumLabelLow"]) && isset($_POST["BIChartSpectrumLabelMedium"]) && isset($_POST["BIChartSpectrumLabelHigh"]) && isset($_POST["BIChartLineText"]) && isset($_POST["AIChartLineText"]) && isset($_POST["BIImgHelpTooltipText"]) && isset($_POST["BIChartHelpTooltipText"]) && isset($_POST["AIChartHelpTooltipText"])) {
					
					$res = putSettings($_POST["BIThresholdLower"], $_POST["BIThresholdUpper"], $_POST["maxXAxisIntervalDays"], $_POST["BIImgHeader"], $_POST["BIChartHeader"], $_POST["AIChartHeader"], $_POST["BIImgLabelLow"], $_POST["BIImgLabelHigh"], $_POST["BIChartSpectrumLabelLow"], $_POST["BIChartSpectrumLabelMedium"], $_POST["BIChartSpectrumLabelHigh"], $_POST["BIChartLineText"], $_POST["AIChartLineText"], $_POST["BIImgHelpTooltipText"], $_POST["BIChartHelpTooltipText"], $_POST["AIChartHelpTooltipText"]);

					if ($res) {
						deliver_response(200, "Innstillingene ble lagret i databasen.", $res);
					} else {
						deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", NULL);
					}
				} else {
					deliver_response(400, "Ugyldig PUT-forespørsel: mangler parametre.", NULL);
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