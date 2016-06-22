<?php
   include('../inc/session.inc.php');
?>
<html>
	<head>
		<meta charset="UTF-8">

		<!-- CSS -->
		<link rel="stylesheet" href="style.css">

		<!-- jQuery -->
		<link rel="stylesheet" href="http://code.jquery.com/mobile/1.4.0/jquery.mobile-1.4.0.min.css" />
		<script src="https://code.jquery.com/jquery-2.2.3.min.js"></script>
		<script src="http://code.jquery.com/mobile/1.4.0/jquery.mobile-1.4.0.min.js"></script>

		<!-- Bootstrap -->
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>

		<!-- Highcharts -->
		<script src="https://code.highcharts.com/highcharts.js"></script>

		<!-- moment.js -->
		<script src="http://momentjs.com/downloads/moment.min.js"></script>
		<script src="http://momentjs.com/downloads/moment-timezone-with-data-2010-2020.min.js"></script>

		<?php
			/*function console_log( $data ){
				echo '<script>';
				echo 'console.log('. json_encode( $data ) .')';
				echo '</script>';
			}*/

			echo "<script>";
			echo "var userID = " . $_SESSION['userid'] . ";";
			echo "var firstName = '" . $firstName . "';";
			echo "var lastName = '" . $lastName . "';";
			echo "</script>";

			/*include('../inc/db.inc.php');
			if ($stmt = $conn->prepare("SELECT mi.value AS mobilityIdx, mi.timeDataCollected FROM SeniorUsers AS su INNER JOIN MobilityIndexes AS mi ON su.userID = mi.userID LEFT JOIN MobilityIndexes AS mi2 ON su.userID = mi2.userID AND mi2.timeDataCollected > mi.timeDataCollected WHERE mi2.timeDataCollected IS NULL AND su.userID = ?")) {
				$stmt->bind_param("i", $_SESSION["userid"]);
				$stmt->execute();
				$result = $stmt->get_result();
				$row = mysqli_fetch_assoc($result);
				$mobilityIdx = $row["mobilityIdx"];
				$timeDataCollected = $row["timeDataCollected"];
				
				date_default_timezone_set('UTC');
				$secDiff = time() - strtotime($timeDataCollected);

				$updateTimeDiffText;
				if ($secDiff < 60) {
					$updateTimeDiffText = "Akkurat nå";
				} else {
					$minDiff = $secDiff / 60;
					if ($minDiff < 60) {
						$updateTimeDiffText = floor($minDiff) . " min. siden";
					} else {
						$hourDiff = $minDiff / 60;
						if ($hourDiff < 24) {
							if ($hourDiff < 2) {
								$updateTimeDiffText = "1 time siden";
							} else {
								$updateTimeDiffText = floor($hourDiff) . " timer siden";
							}
						} else {
							$daysDiff = $hourDiff / 24;
							if ($daysDiff < 2) {
								$updateTimeDiffText = "1 dag siden";
							} else {
								$updateTimeDiffText = floor($daysDiff) . " dager siden";
							}
						}
					}
				}
				$conn->close();
			}*/
		?>

		<!-- JS -->
		<script src="script.js" async></script>

		<title>Adapt frontend test</title>
	</head>
	<body>
		<div data-role="page" id="mainPage">

			<!-- Mobility index image (MIImg) -->
			<div id="MIImgOuterWrapper" class="pageMainElement">
				<div id="MIImgWell" class="well">
					<p id="MIImgHeader"><!--DIN BALANSE:--></p>
					<div id="MIImgInnerWrapper">
						<span class="verticalAlignHelper"></span><img src="//:0" alt="Mobility index" id="MIImg"/>
					</div>
				</div>
			</div>

			<!-- Activity chart -->
			<div id="chartContainer" class="pageMainElement">
				<div id="chartWell" class="well">
					<div id="chart"></div>
				</div>
			</div>

			<!-- Motivating message -->
			<div id="messageWrapper" class="pageMainElement">
				<div class="alert alert-success" role="alert">
					<strong>Bra jobba!</strong> Du har forbedret balansen din den siste uka, og har nå mindre sannsynlighet for å falle. Fortsett slik!
				</div>
			</div>

			<!-- Footer -->
			<div class="footer" data-role="footer">
				<p>
					Innlogget som: <i><span id="userFullName"></span></i><br>
					Sist oppdatert: <span id="lastUpdatedValue"></span>
				</p>
			</div>
			<a href="#settingsPage" id="settingsBtn" class="ui-btn ui-corner-all ui-btn-inline ui-icon-gear ui-btn-icon-left greyBtn" data-transition="flip">Innstillinger</a>
		</div>


		<!-- Settings page -->
		<div data-role="page" id="settingsPage">
			<div id="settingsHeader" data-role="header">
				<h1>Innstillinger</h1>
			</div>
			<!--<a href="#mainPage" id="backBtnHeader" class="ui-btn ui-corner-all ui-btn-inline ui-icon-back ui-btn-icon-left" data-transition="flip">Tilbake</a>-->

			<div data-role="main" class="ui-content">
				<h2 id="MIImgSelectionHeader">Representasjonsbilde for fallrisiko:</h2>
				<div id="MIImgSelectionGroup">
					<img src="img/MIImg/thumbnails/MIImg1.png" id="MIImg1" class="MIImgSelected" alt="Skålvekt"/>
					<img src="img/MIImg/thumbnails/MIImg2.png" id="MIImg2" alt="Blomster"/>
					<img src="img/MIImg/thumbnails/MIImg3.png" id="MIImg3" alt="Meter"/>
				</div>

				<div id="settingsBtnGroup">
					<a href="#mainPage" onclick="closeSettingsView()" id="backBtn" class="ui-btn ui-corner-all ui-icon-back ui-btn-icon-left greyBtn" data-transition="flip">Tilbake</a>
					<a href="#mainPage" onclick="saveChanges()" id="saveBtn" class="ui-btn ui-corner-all ui-icon-check ui-btn-icon-left greenBtn" data-transition="flip">Lagre endringer</a>
					<a href="#popupDialog" id="cancelBtn" data-rel="popup" data-position-to="window" class="ui-btn ui-corner-all ui-icon-delete ui-btn-icon-left greyBtn">Lukk uten å lagre</a>
					<a href="" onclick="logout()" id="logoutBtn" class="ui-btn ui-corner-all ui-icon-power ui-btn-icon-left redBtn">Logg ut</a>

					<div data-role="popup" id="popupDialog" data-overlay-theme="b" data-theme="b" data-dismissible="false" data-history="false" style="max-width:400px;">
					    <div data-role="header" data-theme="a">
					    <h1>Forkast endringer?</h1>
					    </div>
					    <div role="main" class="ui-content">
					        <h3 class="ui-title">Er du sikker på at du ikke vil lagre endringene?</h3>
					        <a onclick="cancelChanges()" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-a" data-rel="back">Ja</a>
					        <a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" data-rel="back">Nei</a>
					    </div>
					</div>
				</div>
			</div>
		</div>

	</body>
</html>