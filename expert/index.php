<?php
	include('../inc/session.inc.php');
?>
<html>
	
	<head>
		<title>AIMS - Ekspertvisning</title>
		<meta name="viewport" content="width=device-width, initial-scale=1">

		<!-- CSS -->
		<link rel="stylesheet" href="style.css">

		<!-- Custom jQuery mobile theme -->
		<link rel="stylesheet" href="../jquery-custom-theme/theme.css" />
  		<link rel="stylesheet" href="../jquery-custom-theme/jquery.mobile.icons.min.css" />
		

		<!-- jQuery -->
		<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>

		<!-- Default jQuery mobile transition -->
		<script>
			$(document).bind("mobileinit", function(){
				$.mobile.defaultPageTransition = "slidefade";
			});
		</script>

		<!-- jQuery Mobile -->
		<link rel="stylesheet" href="http://code.jquery.com/mobile/1.4.5/jquery.mobile.structure-1.4.5.min.css" />
		<!--<link rel="stylesheet" href="http://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min.css">-->
		<script src="http://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min.js"></script>

		<!-- Highcharts -->
		<script src="https://code.highcharts.com/highcharts.js"></script>

		<!-- moment.js -->
		<script src="http://momentjs.com/downloads/moment.min.js"></script>
		<script src="http://momentjs.com/downloads/moment-timezone-with-data-2010-2020.min.js"></script>

		<!-- JS -->
		<script src="script.js" async></script>
	</head>
	
	<body>

		<!-- ******************************************************* -->
		<!-- ********************** Main PAGE ********************** -->
		<!-- ******************************************************* -->
		<div data-role="page" id="mainPage">
			<div data-role="header" data-backbtn="false">
				<h1>Oversikt over brukere</h1>
				<div data-type="horizontal" data-role="controlgroup" class="ui-btn-right">
					<!--<a href="#" class="ui-btn ui-icon-gear ui-btn-icon-left">Innstillinger</a>-->
					<a href="#" onclick="logout()" class="ui-btn ui-icon-power ui-btn-icon-left">Logg ut</a>
				</div>
			</div><!-- /header -->

			<div data-role="content" data-theme="a">
				<?php
					/*function console_log($data){
						echo '<script>';
						echo 'console.log('. json_encode( $data ) .')';
						echo '</script>';
					}*/

					$jsonurl = "http://vavit.no/adapt-staging/api/getSeniorUserOverview.php?expertUserID=" . $_SESSION['userid'];
					$json = file_get_contents($jsonurl);
					$response = json_decode($json);
					$data = $response->data;

					if ($data == null) {
						echo "Det finnes ingen registrerte brukere.";
					} else {
					
				?>

				<form>
					<input id="filterTable-input" data-type="search">
				</form>
				<table data-role="table" data-mode="columntoggle" data-column-btn-text="Velg synlige kolonner" data-filter="true" data-input="#filterTable-input" class="ui-responsive table-stripe ui-shadow" id="usersTable">
					<thead>
						<tr>
							<th data-priority="4">Bruker-ID</th>
							<th>Etternavn</th>
							<th data-priority="1">Fornavn</th>
							<th data-priority="3">Alder</th>
							<th data-priority="2">Mobility index</th>
							<!--<th>Detaljer</th>-->
						</tr>
					</thead>
					<tbody>
						<?php
							$now = new DateTime();
							foreach ((array) $data as $seniorUser) {
								$userID = $seniorUser->userID;

								if ($seniorUser->birthDate != null && $seniorUser->birthDate != "0000-00-00") {
									$birthDate = new DateTime($seniorUser->birthDate);
									$diff = $birthDate->diff($now);
									$age = $diff->y;
								} else {
									$age = "";
								}

						    	echo "<tr>";
						    	echo "<td><a onclick='setActiveUser(" . $userID . ",true);'>" . $userID . "</a></td>";
						    	echo "<td><a onclick='setActiveUser(" . $userID . ",true);'>" . $seniorUser->lastName . "</a></td>";
						    	echo "<td><a onclick='setActiveUser(" . $userID . ",true);'>" . $seniorUser->firstName . "</a></td>";
						    	echo "<td><a onclick='setActiveUser(" . $userID . ",true);'>" . $age . "</a></td>";
						    	echo "<td><a onclick='setActiveUser(" . $userID . ",true);'>" . $seniorUser->mobilityIdx . "</a></td>";
						    	echo "</tr>";
					    	}
						?>
					</tbody>
				</table>
				<?php
					}
				?>
				<a onclick="$.mobile.changePage('index.php#new-user-page');" data-role="button" data-icon="plus">Registrer ny bruker</a>
			</div><!-- /content -->

			<!--<div data-role="footer">
				<div>Logget inn som: <?php /*echo $firstName . " " . $lastName*/ ?></div>
			</div>-->
		</div><!-- /mainPage -->



		<!-- ******************************************************* -->
		<!-- ****************** USER DETAIL PAGE ******************* -->
		<!-- ******************************************************* -->

		<div data-role="page" id="user-detail-page">
			<div data-role="header" data-add-back-btn="true" data-back-btn-text="Tilbake">
				<h1 id="headerTitleDetailView">Brukerdetaljer</h1>
				<div data-type="horizontal" data-role="controlgroup" class="ui-btn-right">
					<!--<a href="#" class="ui-btn ui-icon-gear ui-btn-icon-left">Innstillinger</a>-->
					<a href="#" onclick="logout()" class="ui-btn ui-icon-power ui-btn-icon-left">Logg ut</a>
				</div>
			</div><!-- /header -->

			<div data-role="content" data-theme="a">
				<h1 id="activeUserName"></h1>

				<div id="containerInfoAndBtns">
					<div class="inner">
						<div class="floatItem">
							<table id="userDetailsTable" data-role="table" class="ui-responsive table-stripe ui-shadow">
								<thead>
									<tr>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Mobility index</td>
										<td id="cellMobilityIdx"></td>
									</tr>
									<tr>
										<td>Fødselsdato</td>
										<td id="cellBirthDate"></td>
									</tr>
									<tr>
										<td>Adresse</td>
										<td id="cellAddress"></td>
									</tr>
									<tr>
										<td>Tlf</td>
										<td id="cellPhoneNr"></td>
									</tr>
									<tr>
										<td>Ble med i ADAPT</td>
										<td id="cellDateJoined"></td>
									</tr>
									<tr>
										<td>Kjønn</td>
										<td id="cellGender"></td>
									</tr>
									<tr>
										<td>Vekt</td>
										<td id="cellWeight"></td>
									</tr>
									<tr>
										<td>Høyde</td>
										<td id="cellHeight"></td>
									</tr>
									<!--<tr>
										<td>Antall fall siste 6 mnd</td>
										<td id="cellFalls6"></td>
									</tr>
									<tr>
										<td>Antall fall siste 12 mnd</td>
										<td id="cellFall12"></td>
									</tr>-->
									<tr>
										<td>Bruker ganghjelpemiddel</td>
										<td id="cellWalkingAid"></td>
									</tr>
									<tr>
										<td>Bor for seg selv</td>
										<td id="cellLivingIndependently"></td>
									</tr>
								</tbody>
							</table>
						</div>

						<div id="btnGroupUserDetails" class="floatItem">
							<a onclick="$.mobile.changePage('index.php#register-data-page');" data-role="button" data-icon="plus">Registrer ny mobility idx</a>
							<a onclick="$.mobile.changePage('index.php#register-feedback-page');" data-role="button" data-icon="comment">Skriv/rediger anbefaling</a>
							<a onclick="$.mobile.changePage('index.php#edit-data-page');" data-role="button" data-icon="edit">Rediger opplysninger</a>
							<!--<a onclick="" data-role="button">Se brukerens visning</a>
							<a onclick="" data-role="button">Administrer sensorenheter</a>-->
							<a href="index.php#confirm-delete-user-dialog" data-role="button" data-transition="pop" data-icon="delete">Slett bruker</a>
						</div>
					</div>
				</div>

				<br>
				<hr>
				<br>

				<!-- Mobility idx chart -->
				<div id="chartContainer" class="pageMainElement">
					<div id="chartWell" class="well">
						<div id="chart"></div>
					</div>
				</div>
				
			</div><!-- /content -->

			<!--<div data-role="footer">

			</div>--><!-- /footer -->
		</div><!-- /user-detail-apge -->


		<!-- ******************************************************* -->
		<!-- ***************** REGISTER DATA PAGE ****************** -->
		<!-- ******************************************************* -->
		<div data-role="page" id="register-data-page">
			<div data-role="header" data-add-back-btn="true" data-back-btn-text="Tilbake">
				<h1 id="headerTitleRegisterDataView">Registrer data</h1>
				<div data-type="horizontal" data-role="controlgroup" class="ui-btn-right">
					<!--<a href="#" class="ui-btn ui-icon-gear ui-btn-icon-left">Innstillinger</a>-->
					<a href="#" onclick="logout()" class="ui-btn ui-icon-power ui-btn-icon-left">Logg ut</a>
				</div>
			</div><!-- /header -->

			<div data-role="content" data-theme="a">
				<form id="mobilityIdxForm" method="post">
					<label for="mobilityIdxInputField">Mobility index (1-5):</label>
					<input type="number" name="mobilityIdx" id="mobilityIdxInputField" min="1" max="5" required>
					<input type="hidden" name="userID" value="" id="mobilityIdxFormUserID">
					
					<input type="submit" value="Lagre" data-icon="check" data-iconpos="right" data-theme="b">

					<h3 id="notificationMobilityIdxForm"></h3>
					
				</form>
			</div><!-- /content -->
		</div><!-- /register-data-page -->


		<!-- ******************************************************* -->
		<!-- *************** REGISTER FEEDBACK PAGE **************** -->
		<!-- ******************************************************* -->
		<div data-role="page" id="register-feedback-page">
			<div data-role="header" data-add-back-btn="true" data-back-btn-text="Tilbake">
				<h1 id="headerTitleRegisterDataView">Registrer anbefaling til brukeren</h1>
				<div data-type="horizontal" data-role="controlgroup" class="ui-btn-right">
					<!--<a href="#" class="ui-btn ui-icon-gear ui-btn-icon-left">Innstillinger</a>-->
					<a href="#" onclick="logout()" class="ui-btn ui-icon-power ui-btn-icon-left">Logg ut</a>
				</div>
			</div><!-- /header -->

			<div data-role="content" data-theme="a">
				<form id="registerFeedbackForm" method="post">

					<label for="textarea-feedback">Anbefaling / tilbakemelding:</label>
					<textarea name="feedbackText" id="textarea-feedback" required></textarea>
					<br>

					<!--<fieldset data-role="controlgroup">
						<legend>Velg farge/alvorlighetsgrad:</legend>
							<input type="radio" name="radio-feedback-color" id="radio-feedback-green" value="alert-success" />
							<label for="radio-feedback-green">Grønn (positiv)</label>

							<input type="radio" name="radio-feedback-color" id="radio-feedback-blue" value="alert-info" checked="checked" />
							<label for="radio-feedback-blue">Blå (informativ/nøytral)</label>

							<input type="radio" name="radio-feedback-color" id="radio-feedback-yellow" value="alert-warning" />
							<label for="radio-feedback-yellow">Gul (advarsel)</label>

							<input type="radio" name="radio-feedback-color" id="radio-feedback-red" value="alert-danger" />
							<label for="radio-feedback-red">Rød (alvorlig)</label>
					</fieldset>-->
					<br>

					<input type="hidden" name="userID" id="registerFeedbackFormUserID">

					<input type="submit" value="Lagre" data-icon="check" data-iconpos="right" data-theme="b">
					<a onclick="$.mobile.back()" data-role="button" data-icon="back">Avbryt</a>

					<h3 id="notificationFeedbackForm"></h3>
					
				</form>
			</div><!-- /content -->
		</div><!-- /register-data-page -->


		<!-- ******************************************************* -->
		<!-- ***************** EDIT USER DATA PAGE ***************** -->
		<!-- ******************************************************* -->
		<div data-role="page" id="edit-data-page">
			<div data-role="header" data-add-back-btn="true" data-back-btn-text="Tilbake">
				<h1 id="headerTitleEditDataView">Rediger opplysninger</h1>
				<div data-type="horizontal" data-role="controlgroup" class="ui-btn-right">
					<!--<a href="#" class="ui-btn ui-icon-gear ui-btn-icon-left">Innstillinger</a>-->
					<a href="#" onclick="logout()" class="ui-btn ui-icon-power ui-btn-icon-left">Logg ut</a>
				</div>
			</div><!-- /header -->

			<div data-role="content" data-theme="a">
				<form id="editUserDataForm" method="post">
					<div class="ui-field-contain">
						<label for="inputFieldEditFirstName">Fornavn:</label>
						<input type="text" name="firstName" id="inputFieldEditFirstName">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldEditLastName">Etternavn:</label>
						<input type="text" name="lastName" id="inputFieldEditLastName">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldEditAddress">Adresse:</label>
						<input type="text" name="address" id="inputFieldEditAddress">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldEditZipCode">Postnr:</label>
						<input type="number" name="zipCode" id="inputFieldEditZipCode" min="1" max="9999">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldEditCity">Poststed:</label>
						<input type="text" name="city" id="inputFieldEditCity">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldEditPhone">Telefonnr:</label>
						<input type="number" name="phone" id="inputFieldEditPhone" min="10000000" max="99999999">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldEditWeight">Vekt (kg):</label>
						<input type="number" name="weight" id="inputFieldEditWeight" min="1" max="200">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldEditHeight">Høyde (cm):</label>
						<input type="number" name="height" id="inputFieldEditHeight" min="1" max="250">
					</div>
					
					<!--
					<div class="ui-field-contain">
						<label for="inputFieldEditNumFalls6Mths">Antall fall siste 6 mnd:</label>
						<input type="number" name="falls6Mths" id="inputFieldEditNumFalls6Mths">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldEditNumFalls12Mths">Antall fall siste 12 mnd:</label>
						<input type="number" name="falls12Mths" id="inputFieldEditNumFalls12Mths">
					</div>
					-->

					<label for="inputFieldEditUsesWalkingAid">Bruker ganghjelpemiddel</label>
					<input type="checkbox" name="walkingAid" id="inputFieldEditUsesWalkingAid" value="walkingAid">

					<label for="inputFieldEditLivingIndependently">Bor for seg selv</label>
					<input type="checkbox" name="livingIndependently" id="inputFieldEditLivingIndependently" value="livingIndependently">

					<input type="hidden" name="userID" id="editUserDataFormUserID">

					<input type="submit" value="Lagre" data-icon="check" data-iconpos="right" data-theme="b">

					<h3 id="notificationEditUserDataForm"></h3>
				</form>
			</div><!-- /content -->
		</div><!-- /edit-user-data-page -->


		<!-- ******************************************************* -->
		<!-- ************** CONFIRM DELETE USER DIALOG ************* -->
		<!-- ******************************************************* -->
		<div data-role="page" data-dialog="true" data-close-btn="right" id="confirm-delete-user-dialog">
			<div data-role="header" data-theme="b">
				<h1>Bekreft sletting av bruker</h1>
			</div>

			<div role="main" class="ui-content">
				<h1>Slett bruker?</h1>
				<p>Er du sikker på at du vil slette denne brukeren? Opplysningene vil ikke slettes fra databasen, men brukeren blir markert som inaktiv, og vil ikke vises i listen over brukere.</p>
				<a id="confirmDeleteUserBtn" onclick="deleteUser();" data-rel="back" class="ui-btn ui-shadow ui-corner-all ui-btn-a">Ja, slett brukeren</a>
				<a data-rel="back" class="ui-btn ui-shadow ui-corner-all ui-btn-a">Nei, avbryt</a>
			</div>
		</div> <!-- /confirm delete user dialog -->


		<!-- ******************************************************* -->
		<!-- ******************** NEW USER PAGE ******************** -->
		<!-- ******************************************************* -->
		<div data-role="page" id="new-user-page">
			<div data-role="header" data-add-back-btn="true" data-back-btn-text="Tilbake">
				<h1 id="headerTitleEditDataView">Rediger opplysninger</h1>
				<div data-type="horizontal" data-role="controlgroup" class="ui-btn-right">
					<!--<a href="#" class="ui-btn ui-icon-gear ui-btn-icon-left">Innstillinger</a>-->
					<a href="#" onclick="logout()" class="ui-btn ui-icon-power ui-btn-icon-left">Logg ut</a>
				</div>
			</div><!-- /header -->

			<div data-role="content" data-theme="a">
				<form id="newUserForm" method="post">
					<div class="ui-field-contain">
						<label for="inputFieldNewFirstName">Fornavn (*):</label>
						<input type="text" name="firstName" id="inputFieldNewFirstName" required>
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewLastName">Etternavn (*):</label>
						<input type="text" name="lastName" id="inputFieldNewLastName" required>
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewEmail">E-post (*):</label>
						<input type="email" name="email" id="inputFieldNewEmail" required>
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewPassword">Passord (*):</label>
						<input type="password" name="password" id="inputFieldNewPassword" required>
					</div>

					<div class="ui-field-contain">
						<label for="inputFieldNewBirthDate">Fødselsdato (*):</label>
						<input type="date" name="birthDate" id="inputFieldNewBirthDate" required>
					</div>

					<div class="ui-field-contain">
						<label for="radioGender">Kjønn (*):</label>
						<fieldset data-role="controlgroup" data-type="horizontal" id="radioGender">
							<input type="radio" name="isMale" id="radioGenderMale" value="1" checked="checked">
							<label for="radioGenderMale">Mann</label>
							<input type="radio" name="isMale" id="radioGenderFemale" value="0">
							<label for="radioGenderFemale">Kvinne</label>
						</fieldset>
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewAddress">Adresse:</label>
						<input type="text" name="address" id="inputFieldNewAddress">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewZipCode">Postnr:</label>
						<input type="number" name="zipCode" id="inputFieldNewZipCode" min="1" max="9999">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewCity">Poststed:</label>
						<input type="text" name="city" id="inputFieldNewCity">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewPhone">Telefonnr:</label>
						<input type="number" name="phone" id="inputFieldNewPhone" min="10000000" max="99999999">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewWeight">Vekt (kg):</label>
						<input type="number" name="weight" id="inputFieldNewWeight" min="1" max="200">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewHeight">Høyde (cm):</label>
						<input type="number" name="height" id="inputFieldNewHeight" min="1" max="250">
					</div>
					
					<!--
					<div class="ui-field-contain">
						<label for="inputFieldNewNumFalls6Mths">Antall fall siste 6 mnd:</label>
						<input type="number" name="falls6Mths" id="inputFieldNewNumFalls6Mths">
					</div>
					
					<div class="ui-field-contain">
						<label for="inputFieldNewNumFalls12Mths">Antall fall siste 12 mnd:</label>
						<input type="number" name="falls12Mths" id="inputFieldNewNumFalls12Mths">
					</div>
					-->

					<label for="inputFieldNewUsesWalkingAid">Bruker ganghjelpemiddel</label>
					<input type="checkbox" name="walkingAid" id="inputFieldNewUsesWalkingAid" value="walkingAid">

					<label for="inputFieldNewLivingIndependently">Bor for seg selv</label>
					<input type="checkbox" name="livingIndependently" id="inputFieldNewLivingIndependently" value="livingIndependently">

					<input type="hidden" name="expertUserID" value="<?php echo $_SESSION['userid'] ?>">

					<input type="button" value="Lagre (ikke aktiv ennå)" data-icon="check" data-iconpos="right" data-theme="b">
					<!--<input type="submit" value="Lagre" data-icon="check" data-iconpos="right" data-theme="b">-->

					<h3 id="notificationNewUserForm"></h3>
				</form>
			</div><!-- /content -->
		</div><!-- /new user page -->
	</body>
</html>