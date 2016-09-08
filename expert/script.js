//********************************************************************
//************************ Global variables **************************
//********************************************************************

$activeUserData = null; // Stores data about the currently selected senior user
var userOverview = null; // Stores basic data about all senior users accessible by the expert user
var CSVFileAI = null; // Stores a CSV file for AI values when uploaded
var CSVFileBI = null; // Stores a CSV file for BI values when uploaded

// Data about the logged in expert user
var expertUserID;
var expertFirstName;
var expertLastName;
var expertUsername;
var token; // The JWT used for communicating with the API

var exerciseGroups; // Exercise groups and their exercises that can be recommended to the senior users
var BIThresholdUpper; // The upper threshold value for the 'medium' or 'yellow' area for BI
var BIThresholdLower; // The lower threshold value for the 'medium' or 'yellow' area for BI

// If expert user tries to submit a new BI/AI with a date that already has an BI/AI
// for this senior user, a prompt appears asking to confirm overwrite. The form
// data is stored here temporarily.
var tempBIFormData = null;
var tempAIFormData = null;

// The chart objects and options for these
var balanceChart = null;
var activityChart = null;
var balanceChartOptions = null;
var activityChartOptions = null;



//********************************************************************
//******** Returns the current date to be used as the default ********
//*********************** value in datepickers ***********************
//********************************************************************
Date.prototype.toDateInputValue = (function() {
	var local = new Date(this);
	//local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
	return local.toJSON().slice(0,10);
});



//********************************************************************
//********* Sets the default jQuery mobile page transition ***********
//********************************************************************
$(document).bind("mobileinit", function(){
	$.mobile.defaultPageTransition = "slidefade";
});



//********************************************************************
//**** Every time the user detail page is shown: reflow the charts ***
//***** in case the window size has changed while on another page ****
//********************************************************************
$(document).delegate('#user-detail-page', 'pageshow', function () {
	if ($activeUserData !== null) {
		if (balanceChart !== null) balanceChart.reflow();
		if (activityChart !== null) activityChart.reflow();
	}
});


//********************************************************************
//***** Disable the flip switches on personalized-feedback-page ******
//******************** if no messages are present ********************
//********************************************************************
$(document).on("pagebeforeshow", "#personalized-feedback-page", function () {
	if ($activeUserData) {
		if ($activeUserData.customAIFeedback == null) {
			$("#flipPersonalizedAI").flipswitch("disable");
		} else {
			$("#flipPersonalizedAI").flipswitch("enable");
		}
		if ($activeUserData.customBIFeedback == null) {
			$("#flipPersonalizedBI").flipswitch("disable");
		} else {
			$("#flipPersonalizedBI").flipswitch("enable");
		}
	}
});




//********************************************************************
//*** Runs when the DOM is ready for JavaScript code to execute. *****
//********************************************************************
$(document).ready(function() {
	// Checks if the token and user data exist in localStorage
	if (localStorage.token && localStorage.userid && localStorage.firstname && localStorage.lastname && localStorage.username) {
		// Fetches token and data about the logged in user from localStorage
		token = localStorage.token;
		expertUserID = localStorage.userid;
		expertFirstName = localStorage.firstname;
		expertLastName = localStorage.lastname;
		expertUsername = localStorage.username;
	} else {
		// Redirect to login page
		window.location.replace("../index.html");
	}

	// Fetches the detfault feedback messages from the db, and populates the DOM.
	getDefaultFeedbackMsgs();

	// Fetches data about the senior users that the expert user has access to from db. 
	getUserOverview();

	// Checks if the browser supports file upload
	if (isFileAPIAvailable()) {
		// Binds function to be called when a file is uploaded
		$('#csvFileInputAI').bind('change', handleAIFileSelect);
		$('#csvFileInputBI').bind('change', handleBIFileSelect);
	}


	$("#selectAllSMSRecipients").click(function() { 
		$("INPUT[name='phone[]']").prop('checked', true).checkboxradio('refresh');
		return false;
	});


	$("#selectNoSMSRecipients").click(function() {
		$("INPUT[name='phone[]']").prop('checked', false).checkboxradio('refresh');
		return false;
	});


	//********************************************************************
	//*********** Submit form for storing new balance index **************
	//********************************************************************
	$("#balanceIdxForm").submit(function(e){
		showLoader(); // Shows the loading widget

		// Fetch the BI form value from the DOM
		$balanceIdxValue = $('#balanceIdxInputField').val();

		// Serialize the form data and append the senior user ID
		formData = $("#balanceIdxForm").serialize();
		formData += "&userID=" + $activeUserData.userID;

		// Check if a BI value is already registered for the given date
		var match = null;
		if ($activeUserData.balanceIdxs) {
			for (var i=0; i<$activeUserData.balanceIdxs.length; i++) {
				if ($activeUserData.balanceIdxs[i].timeDataCollected == $("#balanceIdxDatePicker").val()) {
					match = $activeUserData.balanceIdxs[i];
				}
			}
		}

		if (match == null) {
			// No conflicting dates. Form data is sent to DB.
			writeNewBI(formData, false);
		} else {
			// A match was found for the submitted date in the DB.
			// Page for confirming overwrite is prepared and displayed.
			formData += "&balanceIndexID=" + match.balanceIndexID;
			tempBIFormData = formData;
			$("#overwriteBIDialogOldValue").html(match.value);
			$("#overwriteBIDialogDate").html(match.timeDataCollected);
			$("#overwriteBIDialogNewValue").html($balanceIdxValue);
			
			$.mobile.changePage( "index.html#confirm-overwrite-bi-dialog", { transition: "pop" });
		}

		// Empties the form
		$('#balanceIdxDatePicker').val("");
		$('#balanceIdxInputField').val("");
		$('#balanceIdxInputField').focus();

		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//*********** Submit form for storing new activity index *************
	//********************************************************************
	$("#activityIdxForm").submit(function(e){
		showLoader(); // Shows the loading widget

		// Fetch the AI form value from the DOM
		$activityIdxValue = $('#activityIdxInputField').val();

		// Serialize the form data and append the senior user ID
		formData = $("#activityIdxForm").serialize();
		formData += "&userID=" + $activeUserData.userID;
		
		// Check if an AI value is already registered for the given date
		var match = null;
		if ($activeUserData.activityIdxs) {
			for (var i=0; i<$activeUserData.activityIdxs.length; i++) {
				if ($activeUserData.activityIdxs[i].timeDataCollected == $("#activityIdxDatePicker").val()) {
					match = $activeUserData.activityIdxs[i];
				}
			}
		}

		if (match == null) {
			// No conflicting dates. Form data is sent to DB.
			writeNewAI(formData, false);
		} else {
			// A match was found for the submitted date in the DB.
			// Page for confirming overwrite is prepared and displayed.
			formData += "&activityIndexID=" + match.activityIndexID;
			tempAIFormData = formData;
			$("#overwriteAIDialogOldValue").html(match.value);
			$("#overwriteAIDialogDate").html(match.timeDataCollected);
			$("#overwriteAIDialogNewValue").html($activityIdxValue);
			
			$.mobile.changePage( "index.html#confirm-overwrite-ai-dialog", { transition: "pop" });
		}
		
		// Empties the form
		$('#activityIdxDatePicker').val("");
		$('#activityIdxInputField').val("");
		$('#activityIdxInputField').focus();

		return false; // Returns false to stop the default form behaviour
	});
	


	//********************************************************************
	//***** Submit form for storing new custom AI feedback message *******
	//********************************************************************
	$("#registerPersonalizedAIFeedbackForm").submit(function(e){
		showLoader(); // Shows the loading widget
		formData = $("#registerPersonalizedAIFeedbackForm").serialize(); // Serialize the form data
		
		submitCustomFeedbackMsg(formData, "#toastPersonalizedFeedback", true); // Calls the API to store the new feedback msg
		
		$('#textareaPersonalizedAIFeedback').val(""); // Empties the feedback input field
		return false; // Returns false to stop the default form behaviour
	});
	


	//********************************************************************
	//***** Submit form for storing new custom BI feedback message *******
	//********************************************************************
	$("#registerPersonalizedBIFeedbackForm").submit(function(e){
		showLoader(); // Shows the loading widget
		formData = $("#registerPersonalizedBIFeedbackForm").serialize();// Serialize the form data
		
		submitCustomFeedbackMsg(formData, "#toastPersonalizedFeedback", false); // Calls the API to store the new feedback msg
		
		$('#textareaPersonalizedBIFeedback').val(""); // Empties the feedback input field
		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//*************** Submit form for updating user data *****************
	//********************************************************************
	$("#editUserDataForm").submit(function(e){
		var editPhoneNumber = $("#inputFieldEditPhone").val();
		if (editPhoneNumber === null || editPhoneNumber === "" || validMobilePhoneNumber(editPhoneNumber)) {
			showLoader(); // Shows the loading widget

			var username = $("#inputFieldEditUsername").val();
			var usernameUnique = false;
				
			// Serialize the form data and append the senior user ID
			formData = $("#editUserDataForm").serialize();
			formData += "&seniorUserID=" + $activeUserData.userID;

			$.when($.ajax({
				type: "GET",
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				url: "../api/checkUsernameAvailability.php?username=" + username,
				success: function(data, status) { // If the API request is successful
					
					if (data.data) {
						if (data.data == -1 || data.data == $activeUserData.userID) {
							usernameUnique = true;
						} else {
							showToast("#toastEditUserDataForm", false, "Brukernavnet er allerede i bruk", 3000); // Shows toast with error msg
						}
					} else {
						showToast("#toastEditUserDataForm", false, "Det ble ikke opprettet forbindelse med databasen", 3000); // Shows toast with error msg
					}
				},
				error: function(data, status) {
					hideLoader(); // Hides the loading widget
					showToast("#toastEditUserDataForm", false, "Det oppstod en feil", 3000); // Shows toast with error msg
				}
			})).then(function(data, textStatus, jqXHR) {

				if (usernameUnique) {
					$.ajax({
						type: "PUT",
						beforeSend: function (request) {
							request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
						},
						url: "../api/seniorUserData.php",
						data: formData,
						success: function(data, status) { // If the API request is successful
							
							if (data.data) {
								$activeUserData.firstName = $("#inputFieldEditFirstName").val();
								$activeUserData.lastName = $("#inputFieldEditLastName").val();

								setActiveUser($activeUserData.userID, false); // Sets the active user, which in turn updates the DOM with new user data
								updateUsersTableRow(); // Updates the values in the row in the user overview table corresponding to the active user

								showToast("#toastEditUserDataForm", true, data.status_message, 3000); // Shows toast with success msg
							} else {
								showToast("#toastEditUserDataForm", false, data.status_message, 3000); // Shows toast with error msg
							}
						},
						error: function(data, status) {
							hideLoader(); // Hides the loading widget
							showToast("#toastEditUserDataForm", false, data.status_message, 3000); // Shows toast with error msg
						}
					});
				} else {
					hideLoader(); // Hides the loading widget
				}
			});
		} else {
			showToast("#toastEditUserDataForm", false, "Det oppgitte mobilnummeret er ugyldig.", 3000); // Shows toast with error msg
		}
			

		return false; // Returns false to stop the default form behaviour
	});


	//********************************************************************
	//************* Submit form for adding new senior user ***************
	//********************************************************************
	$("#newUserForm").submit(function(e){
		var newPhoneNumber = $("#inputFieldEditPhone").val();
		if (newPhoneNumber === null || newPhoneNumber === "" || validMobilePhoneNumber(newPhoneNumber)) {
			showLoader(); // Shows the loading widget

			var username = $("#inputFieldNewUsername").val();
			var usernameUnique = false;

			// Serialize the form data and append the senior user ID
			formData = $("#newUserForm").serialize();
			formData += ("&expertUserID=" + expertUserID);


			$.when($.ajax({
				type: "GET",
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				url: "../api/checkUsernameAvailability.php?username=" + username,
				success: function(data, status) { // If the API request is successful
					
					if (data.data) {
						usernameUnique = (data.data === -1); // -1 is returned if no match found for the given username was found
					} else {
						showToast("#toastNewUserForm", false, "Det ble ikke opprettet forbindelse med databasen", 3000); // Shows toast with error msg
					}
				},
				error: function(data, status) {
					hideLoader(); // Hides the loading widget
					console.log("Error writing new user to database. " + data);
					showToast("#toastNewUserForm", false, "Det oppstod en feil", 3000); // Shows toast with error msg
				}
			})).then(function(data, textStatus, jqXHR) {

				if (usernameUnique) {
					$.ajax({
						type: "POST",
						beforeSend: function (request) {
							request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
						},
						url: "../api/seniorUserData.php",
						data: formData,
						success: function(data, status) { // If the API request is successful
							hideLoader(); // Hides the loading widget
							if (data.data) {
								$.mobile.back();
								getUserOverview(); // Updates the DOM with new data from db
								document.getElementById("newUserForm").reset(); // Clears all the input fields in the new user form
								showToast("#toastMainPage"), true, data.status_message;
							} else {
								showToast("#toastNewUserForm", false, data.status_message, 3000); // Shows toast with error msg
							}
							
						},
						error: function(data, status) {
							hideLoader(); // Hides the loading widget
							showToast("#toastNewUserForm", false, data.status_message, 3000); // Shows toast with error msg
						}
					});
				} else {
					showToast("#toastNewUserForm", false, "Det oppgitte brukernavnet er allerede i bruk.", 3000); // Shows toast with error msg
					hideLoader(); // Hides the loading widget
				}
			});
		} else {
			showToast("#toastNewUserForm", false, "Det oppgitte mobilnummeret er ugyldig.", 3000); // Shows toast with error msg
		}

		// Returns false to stop the default form behaviour
		return false;
	});
	


	//********************************************************************
	//******** Submit form for updating default feedback messages ********
	//********************************************************************
	$("#registerDefaultFeedbackForm").submit(function(e){
		showLoader(); // Shows the loading widget
		formData = $("#registerDefaultFeedbackForm").serialize(); // Serialize the form data

		$.ajax({
			type: "PUT",
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			url: "../api/feedbackDefault.php",
			data: formData,
			success: function(data, status) { // If the API request is successful
				hideLoader(); // Hides the loading widget
				showToast("#toastDefaultFeedbackForm", true, data.status_message, 3000); // Shows toast with success msg
			},
			error: function(data, status) {
				hideLoader(); // Hides the loading widget
				showToast("#toastDefaultFeedbackForm", false, data.status_message, 3000); // Shows toast with error msg
			}
		});

		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//*********** Submit form for sending multiple SMS messages **********
	//********************************************************************
	$("#sendBulkSMSForm").submit(function(e){
		showLoader(); // Shows the loading widget
		if ($("#bulkSMSContentField").val().length <= 1224) {
			showLoader(); // Shows the loading widget
			formData = $("#sendBulkSMSForm").serialize(); // Serialize the form data
			formData = formData.replace(/%5B%5D/g, "[]");

			$.ajax({
				type: "POST",
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				url: "../api/sendSMS.php",
				data: formData,
				success: function(data, status) { // If the API request is successful
					if (data.data.ok) {
						$("#bulkSMSContentField").val("");
						showToast("#toastSendBulkSMS", true, data.status_message, 3000); // Shows toast with success msg
					} else {
						showToast("#toastSendBulkSMS", false, "Kunne ikke sende SMSer.", 3000); // Shows toast with error msg
					}
					hideLoader(); // Hides the loading widget
				},
				error: function(data, status) {
					hideLoader(); // Hides the loading widget
					showToast("#toastSendBulkSMS", false, data.status_message, 3000); // Shows toast with error msg
				}
			});
		} else {
			showToast("#toastSendBulkSMS", false, "Meldingen er for lang!", 3000); // Shows toast with error msg
		}

		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//*********** Submit form for sending a single SMS message ***********
	//********************************************************************
	$("#sendSingleSMSForm").submit(function(e){
		showLoader(); // Shows the loading widget
		if ($("#singleSMSContentField").val().length <= 1224) {
			showLoader(); // Shows the loading widget
			formData = $("#sendSingleSMSForm").serialize(); // Serialize the form data

			$.ajax({
				type: "POST",
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				url: "../api/sendSMS.php",
				data: formData,
				success: function(data, status) { // If the API request is successful
					if (data.data.ok) {
						$("#singleSMSContentField").val("");
						showToast("#toastSendSingleSMS", true, data.status_message, 3000); // Shows toast with success msg
					} else {
						showToast("#toastSendSingleSMS", false, "Kunne ikke sende SMS.", 3000); // Shows toast with error msg
					}
					hideLoader(); // Hides the loading widget
				},
				error: function(data, status) {
					hideLoader(); // Hides the loading widget
					showToast("#toastSendSingleSMS", false, data.status_message, 3000); // Shows toast with error msg
				}
			});
		} else {
			showToast("#toastSendSingleSMS", false, "Meldingen er for lang!", 3000); // Shows toast with error msg
		}

		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//************* Submit form for updating general settings ************
	//********************************************************************
	$("#settingsForm").submit(function(e){
		showLoader(); // Shows the loading widget
		$BIThresholdUpperInput = $("#BIThresholdUpperInput").val();
		$BIThresholdLowerInput = $("#BIThresholdLowerInput").val();
		if (parseFloat($BIThresholdUpperInput) > parseFloat($BIThresholdLowerInput)) {
			showLoader(); // Shows the loading widget
			formData = $("#settingsForm").serialize(); // Serialize the form data

			$.ajax({
				type: "PUT",
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				url: "../api/settings.php?BIThresholdUpper=" + $BIThresholdUpperInput + "&BIThresholdLower=" + $BIThresholdLowerInput,
				success: function(data, status) { // If the API request is successful
					if (data.data) {
						showToast("#toastSettingsForm", true, data.status_message, 3000); // Shows toast with success msg
						BIThresholdUpper = $BIThresholdUpperInput;
						BIThresholdLower = $BIThresholdLowerInput;
					} else {
						showToast("#toastSettingsForm", false, "Det oppstod en feil ved skriving til databasen.", 3000); // Shows toast with error msg
					}
					hideLoader(); // Hides the loading widget
				},
				error: function(data, status) {
					showToast("#toastSettingsForm", false, data.status_message, 3000); // Shows toast with error msg
					hideLoader(); // Hides the loading widget
				}
			});
		} else {
			showToast("#toastSettingsForm", false, "Øvre verdi må være høyere enn den nedre!", 3000); // Shows toast with error msg
		}

		return false; // Returns false to stop the default form behaviour
	});
});




//********************************************************************
//****** Fetches the default feedback messages from the DB and *******
//*********************** populates the DOM. *************************
//********************************************************************
function getDefaultFeedbackMsgs() {
	showLoader(); // Shows the loading widget

	$.when($.ajax({
		url: "../api/exerciseGroups.php",
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			console.log("Error fetching data from API: GET request to exerciseGroups.php");
		},
		success: function(data, status) { // If the API request is successful
			exerciseGroups = data.data;
		}
	})).then(function(data, textStatus, jqXHR) {
		if (exerciseGroups !== null) {
			$.ajax({
				url: "../api/feedbackDefault.php",
				type: 'GET',
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				error: function(data, status) {
					hideLoader(); // Hides the loading widget
					console.log("Error fetching data from API: GET request to feedbackDefault.");
				},
				success: function(data, status) { // If the API request is successful
					hideLoader(); // Hides the loading widget
					var msgs = data.data;

					if (msgs !== null) { // Checks that the API call returned data
						// Removes all rows from the feedback table bodies (if any)
						$('#AIDefaultFeedbackTable tbody tr').remove();
						$('#BIDefaultFeedbackTable tbody tr').remove();
						
						var htmlAI = "";
						var htmlBI = "";

						for (var i=0; i<msgs.length; i++) { // Iterates the messages to build a table row for each message

							var isAI = (msgs[i].category === 0);
							var categoryTxt = (isAI ? "AI" : "BI");

							// Builds the HTML code for a table row
							var htmlInputFeedback = "<input type='text' name='msg-" + msgs[i].msgID + "' id='default" + categoryTxt + "FeedbackInput" + msgs[i].idx + "' value='" + msgs[i].feedbackText + "' required>";

							if (isAI) {
								var AIFeedbackType = "Å sitte mindre"; // AIFeedbackType = 0
								if (msgs[i].AIFeedbackType === 1) {
									AIFeedbackType = "Å gå mer";
								}

								htmlAI += "<tr>";
								htmlAI += "<td>" + msgs[i].idx + "</td>";
								htmlAI += "<td>" + AIFeedbackType + "</td>";
								htmlAI += "<td>" + htmlInputFeedback + "</td>";
								htmlAI += "</tr>";
							} else {
								var BISectionText = "";
								if (msgs[i].idx === -1) {
									BISectionText = "Lav";
								} else if (msgs[i].idx === 0) {
									BISectionText = "Medium";
								} else if (msgs[i].idx === 1) {
									BISectionText = "Høy";
								}

								// Builds the html for the dropdown boxes for selecting balance and strength exercises
								var optionsBalanceExercisesHtml = generateExerciseDropdownOptionHTML(msgs[i].idx, msgs[i].balanceExerciseID, 0);
								var optionsStrengthExercisesHtml = generateExerciseDropdownOptionHTML(msgs[i].idx, msgs[i].strengthExerciseID, 1);

								htmlBI += "<tr>";
								htmlBI += "<td>" + BISectionText + "</td>";
								htmlBI += "<td>" + htmlInputFeedback + "</td>";
								htmlBI += "<td><select name='balanceExercise-" + msgs[i].msgID + "'>" + optionsBalanceExercisesHtml + "</select></td>";
								htmlBI += "<td><select name='strengthExercise-" + msgs[i].msgID + "'>" + optionsStrengthExercisesHtml + "</select></td>";
								htmlBI += "</tr>";
							}
						}

						// Inserts the generated HTML into the DOM
						$("#AIDefaultFeedbackTable tbody").append(htmlAI);
						$("#BIDefaultFeedbackTable tbody").append(htmlBI);
					} else {
						console.log("No feedback messages returned from API.");
					}
				}
			});
		}
	});
	
}


//********************************************************************
//******* Generates the options elements used in a select box ********
//********* to select an exercise to link to a feedback msg. *********
//** The indexSection parameter indicates if the exercises should  ***
//*********** be connected to low, medium or high BI value. **********
//********************************************************************
function generateExerciseDropdownOptionHTML(indexSection, selectedID, exerciseType) {
	var html = "";

	for (var i=0; i<exerciseGroups.length; i++) {
		if (exerciseGroups[i].exerciseType === exerciseType) {
			for (var j=0; j<exerciseGroups[i].exercises.length; j++) {
				var exercise = exerciseGroups[i].exercises[j];
				if (exercise.indexSection === indexSection) {
					
					html += "<option value='" + exercise.exerciseID + "'";
					if (selectedID === exercise.exerciseID) {
						html += " selected";
					}
					html += ">" + exercise.title + "</option>";
				}
			}
		}
	}

	return html;
}



//********************************************************************
//**** Fetches data about the senior users that the expert user ******
//******************* has access to from the DB. *********************
//********************************************************************
function getUserOverview() {
	showLoader(); // Shows the loading widget
	$.when($.ajax({
		url: "../api/seniorUserOverview.php",
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) {
			console.log("Error fetching data from API seniorUserOverview.");
		},
		success: function(data, status) { // If the API request is successful
			userOverview = data.data;

			// Inserts the users and their phone number as values for the checkboxes on the page for sending SMSes to multiple recipients.
			populateSMSCheckboxes();

			if (userOverview !== null) { // Checks that the API call returned data
				$('#usersTable').remove(); // Removes all rows from the usersTable body (if any)
				
				var html = '<table data-role="table" data-mode="columntoggle" data-column-btn-text="Velg synlige kolonner" '
					+ 'data-filter="true" data-input="#filterTable-input" class="ui-responsive table-stripe ui-shadow" id="usersTable">'
					+ '<thead>'
					+ '<tr>'
					+ '<th >Etternavn</th>'
					+ '<th data-priority="1">Fornavn</th>'
					+ '<th data-priority="2">Alder</th>'
					+ '<th data-priority="3">BI</th>'
					+ '<th data-priority="4">AI</th>'
					+ '</tr>'
					+ '</thead>'
					+ '<tbody>';

				for (var i=0; i<userOverview.length; i++) { // Iterates the user data to build a table row for each entry
					
					// If BI/AI is null, replace it with empty string
					var balanceIdx = (userOverview[i].balanceIdx === null) ? "" : userOverview[i].balanceIdx;
					var activityIdx = (userOverview[i].activityIdx === null) ? "" : userOverview[i].activityIdx;

					$age = calculateAge(userOverview[i].birthDate); // Calculate the age of the senior user in years

					html += "<tr id='userRow" + userOverview[i].userID + "'>"
						+ "<td><a onclick='setActiveUser(" + userOverview[i].userID + ",true);'>" + userOverview[i].lastName + "</a></td>"
						+ "<td class='ui-table-priority-1'><a onclick='setActiveUser(" + userOverview[i].userID + ",true);'>" + userOverview[i].firstName + "</a></td>"
						+ "<td class='ui-table-priority-2'><a onclick='setActiveUser(" + userOverview[i].userID + ",true);'>" + $age + "</a></td>"
						+ "<td class='ui-table-priority-4'><a onclick='setActiveUser(" + userOverview[i].userID + ",true);'>" + balanceIdx + "</a></td>"
						+ "<td class='ui-table-priority-5'><a onclick='setActiveUser(" + userOverview[i].userID + ",true);'>" + activityIdx + "</a></td>"
						+ "</tr>";
				}

				html += '</tbody></table>';
				
				$("#usersTable-popup-popup").remove();  
				$('#usersTableContainer').html(html).enhanceWithin();
			} else {
				console.log("No user data returned from API.");
			}
		}
	})).then(function(data, textStatus, jqXHR) {
		$.ajax({
			url: "../api/settings.php",
			type: 'GET',
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			error: function(data, status) {
				console.log("Error fetching data from API settings.php");
				hideLoader(); // Hides the loading widget
			},
			success: function(data, status) { // If the API request is successful
				if (data.data) {
					BIThresholdUpper = data.data.BIThresholdUpper;
					BIThresholdLower = data.data.BIThresholdLower;

					$("#BIThresholdUpperInput").val(BIThresholdUpper);
					$("#BIThresholdLowerInput").val(BIThresholdLower);
				} else {
					console.log("Error loading data from the API settings.php");
				}
				hideLoader(); // Hides the loading widget
			}
		});
	});
}



//********************************************************************
//** Feches data about a specific senior user and writes to the DOM **
//********************************************************************
function setActiveUser(userID, changePage) {

	// Don't fetch data again if the DOM already contains the data for the requested user
	if (changePage && $activeUserData !== null && $activeUserData.userID == userID) {
		$.mobile.changePage("index.html#user-detail-page");
		return;
	}

	showLoader(); // Shows the loading widget

	balanceChart = null;
	activityChart = null;
	balanceChartOptions = null;
	activityChartOptions = null;

	// Hides the charts until they are populated with data
	$("#balanceChartContainer").hide();
	$("#activityChartContainer").hide();

	// Sets global options for the charts
	Highcharts.setOptions({
		// Defines Norwegian text strings used in the charts
		lang: {
			months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni',  'juli', 'august', 'september', 'oktober', 'november', 'desember'],
			shortMonths: ['jan', 'feb', 'mars', 'apr', 'mai', 'juni',  'juli', 'aug', 'sep', 'okt', 'nov', 'des'],
			weekdays: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
			shortWeekdays: ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø'],
			decimalPoint: ',',
			thousandsSep: ' '
		}
	});

	// Displays the initial character count for SMS sending
	countSMSChar(document.getElementById("bulkSMSContentField"), "charCounterBulkSMS");
	countSMSChar(document.getElementById("singleSMSContentField"), "charCounterSingleSMS");


	clearUserDetailsTable(); // Removes existing content (if any) from the user details table
	//document.getElementById("editUserDataForm").reset(); // Removes existing content (if any) from the edit user form

	$('#tablePersonalizedAIFeedbackMsgs tbody tr').remove(); // Removes all content (if any) from them AI feedback table
	$('#tablePersonalizedBIFeedbackMsgs tbody tr').remove(); // Removes all content (if any) from them BI feedback table
	$('#personalizedAIFeedbackMsgsContainer').hide(); // Hides the container of the AI feedback (will be shown again if AI feedback is found in DB)
	$('#personalizedBIFeedbackMsgsContainer').hide(); // Hides the container of the BI feedback (will be shown again if BI feedback is found in DB)

	if (changePage) { // If the function is called from the main page: redirect to the user detail page
		$.mobile.changePage("index.html#user-detail-page");
	}

	$.when($.ajax({
		//********************************************************************
		//**************** Get details about the senior user *****************
		//********************************************************************
		url: "../api/seniorUserData.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) {
			console.log("Error getting the user details. Msg from API: " + status);
		}, 
		success: function(data, status) { // If the API request is successful
			$activeUserData = data.data;

			$activeUserData.showPersonalizedAIFeedback = ($activeUserData.showPersonalizedAIFeedback == "1" ? true : false);
			$activeUserData.showPersonalizedBIFeedback = ($activeUserData.showPersonalizedBIFeedback == "1" ? true : false);
			$activeUserData.customAIFeedback = null;
			$activeUserData.customBIFeedback = null;

			// Sets current values and adds change listeners to the flip switches on personalized-feedback-page
			initCustomFeedbackFlipSwitches();

			getCustomFeedbackMsgs(userID); // Fetches feedback messages for the senior user from DB
		}
	})).then(function(data, textStatus, jqXHR) {
		$.when($.ajax({
			//********************************************************************
			//********** Get balance indexes to populate the BI chart ************
			//********************************************************************
			url: "../api/balanceIdx.php?seniorUserID=" + userID,
			type: 'GET',
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			error: function(data, status) {
				console.log("Error attempting to call API: GET request to balanceIdx.php with parameter seniorUserID=" + userID);
			}, 
			success: function(data, status) { // If the API request is successful
				var balanceChartDataJSON = data.data;
				$activeUserData.balanceIdxs = balanceChartDataJSON; // Store the BI values in $activeUserData
				var balanceChartData = [];

				if (balanceChartDataJSON !== null) {
					for (var i=0; i<balanceChartDataJSON.length; i++) {
						// Comment out if chart is changed to a column chart!
						if (i != 0) {
							// Draws an extra data point right before each data point (except the first) 
							// to get a flat line instead of a straight, diagonal line between the points.
							// Needs to be commented out if the chart is switched to a column chart.
							var dataPointPre = [];
							var datePre = new Date(balanceChartDataJSON[i].timeDataCollected);
							datePre.setSeconds(datePre.getSeconds() - 1);
							dataPointPre.push(datePre.getTime());
							dataPointPre.push(parseFloat(balanceChartDataJSON[i-1].value));
							balanceChartData.push(dataPointPre);
						}

						var bi = parseFloat(balanceChartDataJSON[i].value);

						var dataPoint = [];
						var date = Date.parse(balanceChartDataJSON[i].timeDataCollected);
						dataPoint.push(date);
						dataPoint.push(bi);
						balanceChartData.push(dataPoint);

						// Comment out if chart is changed to a column chart!
						// If last data point from db, add a final data point at the current datetime
						if (i+1 == balanceChartDataJSON.length) {
							var dataPointFinal = [];
							var value = parseFloat(balanceChartDataJSON[i].value);
							dataPointFinal.push(new Date().getTime());
							dataPointFinal.push(value);
							balanceChartData.push(dataPointFinal);

							$activeUserData.balanceIdx = value;
						}
					}

					balanceChartOptions = {
						chart: {
							renderTo: 'balanceChart', // ID of div where the chart is to be rendered
							type: 'area', // Chart type. Can e.g. be set to 'column' or 'area'
							zoomType: 'x', // The chart is zoomable along the x-axis by clicking and draging over a portion of the chart
							backgroundColor: null,
							reflow: true
						},
						title: {
							text: 'Balance index'
						},
						xAxis: {
							type: 'datetime',
							tickInterval: 24 * 3600 * 1000 // How frequent a tick is displayed on the axis (set in milliseconds)
						},
						yAxis: {
							title: {
								enabled: false
							},
							max: 1, // The ceiling value of the y-axis
							min: -1, // The floor of the y-axis
							endOnTick: false,
							alternateGridColor: '#DEE0E3',
							tickInterval: 0.1, // How frequent a tick is displayed on the axis
							plotLines: [{
								color: 'black', // Color value
								dashStyle: 'ShortDash', // Style of the plot line. Default to solid
								value: 0, // Value of where the line will appear
								width: 2, // Width of the line
								label: { 
									text: 'Normalverdi', // Content of the label. 
									align: 'left'
								}
							}]
						},
						legend: {
							enabled: false // Hides the legend showing the name and toggle option for the series
						},
						credits: {
							enabled: false // Hides the Highcharts credits
						},
						series: [{
							threshold: -1,
							data: balanceChartData
						}]
					};

					balanceChart = new Highcharts.Chart(balanceChartOptions);


					// Calculates whether the current BI value for this user is classified as low, medium or high
					var BISection = -1;
					if ($activeUserData.balanceIdx >= BIThresholdLower && $activeUserData.balanceIdx < BIThresholdUpper) {
						BISection = 0;
					} else if ($activeUserData.balanceIdx > BIThresholdUpper) {
						BISection = 1;
					}

					// Populate the dropdown for selecting linked exercise to new personalized BI feedback msgs
					$("#selectPersonalizedBIFeedbackBalanceExercise").html(generateExerciseDropdownOptionHTML(BISection, -1, 0));
					$("#selectPersonalizedBIFeedbackStrengthExercise").html(generateExerciseDropdownOptionHTML(BISection, -1, 1));
				}
			}
		}), $.ajax({
			//********************************************************************
			//********** Get activity indexes to populate the AI chart ***********
			//********************************************************************

			url: "../api/activityIdx.php?seniorUserID=" + userID,
			type: 'GET',
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			error: function(data, status) {
				console.log("Error attempting to call API: GET request to activityIdx.php with parameter seniorUserID=" + userID);
				hideLoader();
			}, 
			success: function(data, status) { // If the API request is successful
				var activityChartDataJSON = data.data;
				$activeUserData.activityIdxs = activityChartDataJSON; // Store the AI values in $activeUserData

				if (activityChartDataJSON !== null) {
					$activeUserData.activityIdx = activityChartDataJSON[activityChartDataJSON.length-1].value;

					var activityChartData = [];
					for (var i=0; i<activityChartDataJSON.length; i++) {
						// Uncomment if chart is area chart!
						/*if (i != 0) {
							var dataPointPre = [];
							var datePre = new Date(activityChartDataJSON[i].timeDataCollected);
							datePre.setSeconds(datePre.getSeconds() - 1);
							dataPointPre.push(datePre.getTime());
							dataPointPre.push(activityChartDataJSON[i-1].value);
							activityChartData.push(dataPointPre);
						}*/

						var dataPoint = [];
						var date = Date.parse(activityChartDataJSON[i].timeDataCollected);
						dataPoint.push(date);
						dataPoint.push(activityChartDataJSON[i].value);
						activityChartData.push(dataPoint);

						// Uncomment if chart is area chart!
						// If last data point from db, add a final data point one day after the last, to make the last change more visible
						/*if (i+1 == activityChartDataJSON.length) {
							var dataPointFinal = [];
							date.setDate(date.getDate() + 1);
							dataPointFinal.push(date);
							dataPointFinal.push(activityChartDataJSON[i].value);
							activityChartData.push(dataPointFinal);
						}*/
					}

					activityChartOptions = {
						chart: {
							renderTo: 'activityChart', // ID of div where the chart is to be rendered
							type: 'column', // Chart type. Can e.g. be set to 'column' or 'area'
							zoomType: 'x', // The chart is zoomable along the x-axis by clicking and draging over a portion of the chart
							backgroundColor: null,
							reflow: true
						},
						title: {
							text: 'Activity index'
						},
						xAxis: {
							type: 'datetime',
							tickInterval: 24 * 3600 * 1000 // How frequent a tick is displayed on the axis (set in milliseconds)
						},
						yAxis: {
							title: {
								enabled: false
							},
							max: 5, // The ceiling value of the y-axis
							min: 0, // The floor of the y-axis
							alternateGridColor: '#DEE0E3',
							tickInterval: 1, // How frequent a tick is displayed on the axis
							plotLines: [{
								color: 'black', // Color value
								dashStyle: 'ShortDash', // Style of the plot line. Default to solid
								value: $activeUserData.AIChartLineValue, // Value of where the line will appear
								width: 2, // Width of the line
								label: { 
									text: 'Normalverdi', // Content of the label. 
									align: 'left'
								}
							}]
						},
						legend: {
							enabled: false // Hides the legend showing the name and toggle option for the series
						},
						credits: {
							enabled: false // Hides the Highcharts credits
						},
						series: [{}]
					};

					activityChartOptions.series[0].data = activityChartData;

					activityChart = new Highcharts.Chart(activityChartOptions);
				}
				hideLoader();
			}
		})).then(function(data, textStatus, jqXHR) {
			updateDOM(); // Populates the user detail and edit user data pages with data from $activeUserData

			// Displays the charts in the DOM if they have been set
			if (balanceChartOptions) {
				$("#balanceChartContainer").show();
				balanceChart = new Highcharts.Chart(balanceChartOptions);
			}

			if (activityChartOptions) {
				$("#activityChartContainer").show();
				activityChart = new Highcharts.Chart(activityChartOptions);
			}
		});
	});
}



//********************************************************************
//***** Call API with a submitted personalized feedback message ******
//********************************************************************
function submitCustomFeedbackMsg(formData, toastID, isAI) {
	// Append the senior user ID to the form data
	formData += "&userID=" + $activeUserData.userID;
	
	$.ajax({
		type: "POST",
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: "../api/feedbackCustom.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			getCustomFeedbackMsgs($activeUserData.userID); // Fetches personalized feedback messages from DB to update the tables
			showToast(toastID, true, data.status_message, 3000); // Shows toast with success msg

			if (isAI) {
				$("#flipPersonalizedAI").flipswitch("enable");
			} else {
				$("#flipPersonalizedBI").flipswitch("enable");
			}
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast(toastID, false, data.status_message, 3000); // Shows toast with error msg
		}
	});
}


//********************************************************************
//* Called from the confirm dialog for overwriting existing BI value *
//********************************************************************
function updateBI(doUpdate) {
	if (doUpdate) writeNewBI(tempBIFormData, true);
	tempBIFormData = null;
}

//********************************************************************
//* Called from the confirm dialog for overwriting existing AI value *
//********************************************************************
function updateAI(doUpdate) {
	if (doUpdate) writeNewAI(tempAIFormData, true);
	tempAIFormData = null;
}



//********************************************************************
//****************** Writes new/updates BI to DB *********************
//********************************************************************
function writeNewBI(formData, update) {
	showLoader(); // Shows the loading widget

	// Calls different API depending on whether the data is 
	// stored as a new entry, or updating an existing entry
	var requestType = (update ? "PUT" : "POST"); 
	
	$.ajax({
		type: requestType,
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: "../api/balanceIdx.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			if (data.data) {
				showToast("#toastBalanceIdxManualForm", true, data.status_message, 3000); // Shows toast with success msg
			} else {
				showToast("#toastBalanceIdxManualForm", false, data.status_message, 3000); // Shows toast with error msg
			}
			
			setActiveUser($activeUserData.userID, false); // Sets the active user, which in turn updates the active user data and charts
			updateUsersTableRow(); // Updates the values in the row in the user overview table corresponding to the active user
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast("#toastBalanceIdxManualForm", false, data.status_message, 3000); // Shows toast with error msg
		}
	});
}

//********************************************************************
//****************** Writes new/updates BI to DB *********************
//********************************************************************
function writeNewAI(formData, update) {
	showLoader(); // Shows the loading widget

	// Calls different API depending on whether the data is 
	// stored as a new entry, or updating an existing entry
	var requestType = (update ? "PUT" : "POST"); 
	
	$.ajax({
		type: requestType,
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: "../api/activityIdx.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			if (data.data) {
				showToast("#toastActivityIdxManualForm", true, data.status_message, 3000); // Shows toast with success msg
			} else {
				showToast("#toastActivityIdxManualForm", false, data.status_message, 3000); // Shows toast with error msg
			}
			
			setActiveUser($activeUserData.userID, false); // Sets the active user, which in turn updates the active user data and charts
			updateUsersTableRow(); // Updates the values in the row in the user overview table corresponding to the active user
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast("#toastActivityIdxManualForm", false, data.status_message, 3000); // Shows toast with error msg
		}
	});
}



//********************************************************************
//********** Calls API to set a senior user as inactive. *************
//****** Inactive users are not displayed in the expert view. ********
//********************************************************************
function deleteUser() {
	showLoader(); // Shows the loading widget
	userID = $activeUserData.userID;
	$.ajax({
		url: "../api/seniorUserActiveStatus.php?seniorUserID=" + userID,
		type: 'PUT',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			console.log("Error accessing API: PUT request to seniorUserActiveStatus.php with parameter seniorUserID=" + userID);
		}, 
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			$('table tr').each(function(){ // Iterates the table to find the row matching the userID, and removes it
				if ($(this).find('td').eq(0).text() == userID){
					$(this).remove();
				}
			});

			var usersTableRow = findUsersTableRow($activeUserData.userID);
			usersTableRow.remove();

			$.mobile.back(); // Returns to the main page
		}
	});
}



//********************************************************************
//*** Calls API to fetch custom feedback messages for a given user. **
//********************************************************************
function getCustomFeedbackMsgs(userID) {
	$.ajax({
		url: "../api/feedbackCustom.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) {
			console.log("Error fetching data from API: GET request to feedbackCustom.php.");
		},
		success: function(data, status) { // If the API request is successful
			var feedbackData = data.data;

			if (feedbackData !== null) { // Cheks if API returned any data

				var AIFeedbackMsgs = [];
				var BIFeedbackMsgs = [];

				// Sorts the feedback messages into AI and BI
				for (var i=0; i<feedbackData.length; i++) {
					if (feedbackData[i].category === 0) { // category 0 = AI
						AIFeedbackMsgs.push(feedbackData[i]);
					} else { // category 1 = BI
						BIFeedbackMsgs.push(feedbackData[i]);
					}
				}

				if (AIFeedbackMsgs.length > 0) {
					$activeUserData.customAIFeedback = AIFeedbackMsgs;

					// Creates HTML for inserting into AI feedback table
					var htmlAI = '';
					for (var i=0; i<AIFeedbackMsgs.length; i++) {
						var timeCreated = moment(AIFeedbackMsgs[i].timeCreated + "Z");
						timeCreated.tz('Europe/Oslo'); // Converts time to the correct time zone

						htmlAI += "<tr>"
						+ "<td>" + timeCreated.format('YYYY-MM-DD HH:mm') + "</td>"
						+ "<td>" + AIFeedbackMsgs[i].feedbackText + "</td>"
						+ "<td><button data-role='button' data-inline='true' data-mini='true'"
						+ "onclick='deleteFeedbackMsg(" + AIFeedbackMsgs[i].msgID + ")'>Slett</button>" 
						+ "</td></tr>";
					}
					$('#tablePersonalizedAIFeedbackMsgs tbody').html(htmlAI); // Inserts the generated HTML
					$("#personalizedAIFeedbackMsgsContainer").trigger("create"); // Re-apply jQuery Mobile styles to table
					$('#personalizedAIFeedbackMsgsContainer').show(); // Makes table visible
				}
				
				if (BIFeedbackMsgs.length > 0) {
					$activeUserData.customBIFeedback = BIFeedbackMsgs;

					// Creates HTML for inserting into BI feedback table
					var htmlBI = '';
					for (var i=0; i<BIFeedbackMsgs.length; i++) {
						var timeCreated = moment(BIFeedbackMsgs[i].timeCreated + "Z");
						timeCreated.tz('Europe/Oslo'); // Converts time to the correct time zone
						
						htmlBI += "<tr>"
						+ "<td>" + timeCreated.format('YYYY-MM-DD HH:mm') + "</td>"
						+ "<td>" + BIFeedbackMsgs[i].feedbackText + "</td>"
						+ "<td>" + getExerciseTitle(BIFeedbackMsgs[i].balanceExerciseID) + "</td>"
						+ "<td>" + getExerciseTitle(BIFeedbackMsgs[i].strengthExerciseID) + "</td>"
						+ "<td><button data-role='button' data-inline='true' data-mini='true'"
						+ "onclick='deleteFeedbackMsg(" + BIFeedbackMsgs[i].msgID + ")'>Slett</button>" 
						+ "</td></tr>";
					}
					$('#tablePersonalizedBIFeedbackMsgs tbody').html(htmlBI); // Inserts the generated HTML
					$("#personalizedBIFeedbackMsgsContainer").trigger("create"); // Re-apply jQuery Mobile styles to table
					$('#personalizedBIFeedbackMsgsContainer').show(); // Makes table visible
				}
			} else {
				//console.log("No feedback data returned from API.");
			}
		}
	});
}

function deleteFeedbackMsg(msgID) {
	var confirmDelete = confirm("Vil du slette dette rådet?");
	if (confirmDelete) {
		showLoader();
		$.ajax({
			url: '../api/feedbackCustom.php?msgID=' + msgID,
			type: 'DELETE',
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			error: function(data, status) {
				console.log("Error accessing API: DELETE request to feedbackCustom.php with parameter msgID=" + msgID);
				showToast("#toastPersonalizedFeedback", false, "Det oppstod en feil under skriving til databasen.", 3000);

				hideLoader(); // Hides the loading widget
			}, 
			success: function(data, status) { // If the API request is successful
				setActiveUser($activeUserData.userID, false);
				hideLoader();

			}
		});
	}
}


//********************************************************************
//********** Sets current values and adds change listeners  **********
//******** to the flip switches on personalized-feedback-page ********
//********************************************************************
function initCustomFeedbackFlipSwitches() {	
	$("#flipPersonalizedAI").prop("checked", $activeUserData.showPersonalizedAIFeedback);
	$("#flipPersonalizedBI").prop("checked", $activeUserData.showPersonalizedBIFeedback);

	$("#flipPersonalizedAI").on("change", function (e) {
		var flipSwitchState = e.currentTarget.checked;
		
		if (flipSwitchState != $activeUserData.showPersonalizedAIFeedback) {
			showLoader();
			var flipSwitchStateBinary = flipSwitchState ? "1" : "0";

			var url = "../api/feedbackCustom.php?category=0&seniorUserID=" 
				+ $activeUserData.userID + "&value=" + flipSwitchStateBinary;

			$.ajax({
				url: url,
				type: 'PUT',
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				error: function(data, status) {
					console.log("Error accessing API: PUT request to feedbackCustom.php with parameter category=0 and seniorUserID=" 
						+ $activeUserData.userID);
					showToast("#toastPersonalizedFeedback", false, "Det oppstod en feil under skriving til databasen.", 3000);

					hideLoader(); // Hides the loading widget
				}, 
				success: function(data, status) { // If the API request is successful
					var toastSuccessText = (flipSwitchState ? "på" : "av");
					$activeUserData.showPersonalizedAIFeedback = flipSwitchState;
					showToast("#toastPersonalizedFeedback", true, "Personaliserte AI-råd er nå " 
						+ toastSuccessText + "slått for denne brukeren.", 3000);
					hideLoader(); // Hides the loading widget
				}
			});
		}
	});

	$("#flipPersonalizedBI").on("change", function (e) {
		showLoader();
		var flipSwitchState = e.currentTarget.checked;
		
		if (flipSwitchState != $activeUserData.showPersonalizedBIFeedback) {
			var flipSwitchStateBinary = flipSwitchState ? "1" : "0";

			var url = "../api/feedbackCustom.php?category=1&seniorUserID=" 
					+ $activeUserData.userID + "&value=" + flipSwitchStateBinary;

			$.ajax({
				url: url,
				type: 'PUT',
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				error: function(data, status) {
					console.log("Error accessing API: PUT request to feedbackCustom.php with parameter category=1 and seniorUserID=" 
						+ $activeUserData.userID);
					showToast("#toastPersonalizedFeedback", false, "Det oppstod en feil under skriving til databasen.", 3000);
					hideLoader(); // Hides the loading widget
				}, 
				success: function(data, status) { // If the API request is successful
					var toastSuccessText = (flipSwitchState ? "på" : "av");
					$activeUserData.showPersonalizedBIFeedback = flipSwitchState;
					showToast("#toastPersonalizedFeedback", true, "Personaliserte BI-råd er nå " 
						+ toastSuccessText + "slått for denne brukeren.", 3000);
					hideLoader(); // Hides the loading widget
				}
			});
		}
	});
}



//********************************************************************
//******* Fetches the title of an exercise given a certain ID  *******
//********************************************************************
function getExerciseTitle(exerciseID) {
	if (exerciseGroups !== null || exerciseID !== null) {
		for (var i=0; i<exerciseGroups.length; i++) {
			for (var j=0; j<exerciseGroups[i].exercises.length; j++) {
				if (exerciseGroups[i].exercises[j].exerciseID === exerciseID) {
					return exerciseGroups[i].exercises[j].title;
				}
			}
		}
	}
	return "";
}



//********************************************************************
//************ Checks if the browser supports file upload ************
//********************************************************************
function isFileAPIAvailable() {
	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		// Great success! All the File APIs are supported.
		return true;
	} else {
		$("#activityIdxFileInputContainer").hide();
		return false;
	}
}



//********************************************************************
//*********** Called when a AI CSV file has been uploaded. ***********
//********** Stores the uploaded file in a global variable. **********
//********************************************************************
function handleAIFileSelect(evt) {
	var files = evt.target.files; // FileList object
	CSVFileAI = files[0];
}


//********************************************************************
//*********** Called when a BI CSV file has been uploaded. ***********
//********** Stores the uploaded file in a global variable. **********
//********************************************************************
function handleBIFileSelect(evt) {
	var files = evt.target.files; // FileList object
	CSVFileBI = files[0];
}


//********************************************************************
//*********** Called when the save CSV file btn is pressed. **********
//*************** Interprets the data in the CSV file. ***************
//********************************************************************
function readCSVFile(isAI) {
	showLoader(); // Shows the loading widget

	var toastID = (isAI ? "#toastActivityIdxFileUpload" : "#toastBalanceIdxFileUpload");
	var file = null;

	if (isAI) {
		if (CSVFileAI !== null) {
			file = CSVFileAI;
		} else {
			alert("Ingen fil er valgt.");
			hideLoader();
			return false;
		}
	} else { // BI file upload
		if (CSVFileBI !== null) {
			file = CSVFileBI;
		} else {
			alert("Ingen fil er valgt.");
			hideLoader();
			return false;
		}
	}

	var reader = new FileReader();
	reader.readAsText(file);

	reader.onload = function(event) {
		var csv = event.target.result;
		var data = $.csv.toObjects(csv); // Converts the text to js objects

		var validData = [];

		// Exclude empty lines and other invalid entries
		for (var i=0; i<data.length; i++) {
			// check valid date
			if ((typeof data[i].dato != 'undefined') && (data[i].dato !== null) && (data[i].dato != '')) {
				// check valid value
				var value = (isAI ? data[i].ai : data[i].bi);
				if ($.isNumeric(value)) {
					if ((isAI && value >= 0 && value <= 5) || !isAI && value >= -1 && value <= 1) {
						data[i].value = value;

						// Change date format to YYYY-MM-DD
						var dateSplit = data[i].dato.split(".");
						var dateCorrectFormat = dateSplit[2] + "-" + dateSplit[1] + "-" + dateSplit[0];
						data[i].timeDataCollected = dateCorrectFormat;

						var isValid = true;

						// Check if a value is already set for one of the dates in the file
						var compareDates = $activeUserData.balanceIdxs;
						if (isAI) {
							compareDates = $activeUserData.activityIdxs;
						}

						if (compareDates !== null) {
							for (var j=0; j<compareDates.length; j++) {
								if (dateCorrectFormat == compareDates[j].timeDataCollected) {
									alert("Det er allerede registrert en verdi på datoen " + dateCorrectFormat + ". For å overskrive, bruk det manuelle skjemaet.");
									isValid = false;
								}
							}
						}

						if (isValid) {
							validData.push(data[i]);
						}
					}
				}
			}
		}

		if (validData.length == 0) {
			hideLoader(); // Hides the loading widget
			showToast(toastID, false, "Ingen gyldige verdier ble funnet i filen.", 3000);
		} else {
			callAjaxPostIdx(validData, 0, 0, 0, isAI); // Call function to send data to API
		}
	};
	reader.onerror = function() {
		alert('Kunne ikke lese filen ' + file.fileName);
	};

}


//********************************************************************
//******** Recursive function that sends AI or BI data to API ********
//********************************************************************
function callAjaxPostIdx(inputData, idx, successCounter, errorCounter, isAI) {
	var apiUrl = null;
	var valueFieldName = null;
	if (isAI) {
		apiUrl = "../api/activityIdx.php";
		valueFieldName = "activityIdx";
	} else {
		apiUrl = "../api/balanceIdx.php";
		valueFieldName = "balanceIdx";
	}
	
	// Builds form data string
	var formData = "userID=" + $activeUserData.userID
		+ "&timeDataCollected=" + inputData[idx].timeDataCollected
		+ "&" + valueFieldName + "=" + inputData[idx].value;
	
	$.when($.ajax({
		type: "POST",
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: apiUrl,
		data: formData,
		success: function(data, status) { // If the API request is successful
			successCounter++; // increment the number of feedback messages successfully written to DB
		},
		error: function(data, status) {
			errorCounter++; // increment the number of feedback messages that were not written to DB
		}
	})).then(function(data, textStatus, jqXHR) {
		var nextIdx = idx + 1;
		if (nextIdx == inputData.length) { // If function has gone through all feedback messages: exit and show toast
			showNotificationActivityIdxFileUpload(successCounter, errorCounter, isAI);
		} else { // Recursively call the function with the next idx
			callAjaxPostIdx(inputData, nextIdx, successCounter, errorCounter, isAI);
		}
	});
}


/*********************************************************************/
/*Shows a toast when the data from file upload is done being processed/
/*********************************************************************/
function showNotificationActivityIdxFileUpload(successCounter, errorCounter, isAI) {
	var toastID = (isAI ? "#toastActivityIdxFileUpload" : "#toastBalanceIdxFileUpload");

	hideLoader(); // Hides the loading widget

	if (errorCounter > 0) { // If any errors: show error msg
		var total = errorCounter + successCounter;
		var plural = (total > 1) ? "er" : ""; // use plural form if more than one
		var errorMsg = errorCounter + " av " + total + " oppføring" + plural + " ble IKKE lagret i databasen.";
		showToast(toastID, false, errorMsg, 3000);
	} else { // Show success msg
		var plural = (successCounter > 1) ? "er" : ""; // use plural form if more than one
		var successMsg = successCounter + " oppføring" + plural + " ble lagret i databasen.";
		showToast(toastID, true, successMsg, 3000);
	}

	setActiveUser($activeUserData.userID, false); // Sets the active user, which in turn updates the DOM with new user data
}



/*********************************************************************/
/*************** Parses a date string to a date object ***************/
/*********************************************************************/
function parseDate(input) {
  var parts = input.split('-');
  return new Date(parts[0], parts[1]-1, parts[2]);
}



/*********************************************************************/
/********* Clears all the content in the user details table **********/
/*********************************************************************/
function clearUserDetailsTable() {
	$("#activeUserFullName").html("");
	$("#headerTitleDetailPage").html("");
	
	$("#cellBalanceIdx").html("");
	$("#cellActivityIdx").html("");
	$("#cellBirthDate").html("");
	$("#cellAddress").html("");
	$("#cellPhoneNr").html("");
	$("#cellDateJoined").html("");
	$("#cellGender").html("");
	$("#cellWeight").html("");
	$("#cellHeight").html("");
	$("#cellFalls3").html("");
	$("#cellFall12").html("");
	$("#cellWalkingAid").html("");
	$("#cellLivingIndependently").html("");
	$("#cellComment").html("");
}



/*********************************************************************/
/**** Calculates the age of a user in years based on date of birth ***/
/*********************************************************************/
function calculateAge(birthDate) {
	if (birthDate !== null && birthDate != "0000-00-00") {
		birthDateSplit = birthDate.split('-');
		birthYear = birthDateSplit[0];
		birthMonth = birthDateSplit[1];
		birthDay = birthDateSplit[2];

		todayDate = new Date();
		todayYear = todayDate.getFullYear();
		todayMonth = todayDate.getMonth();
		todayDay = todayDate.getDate();
		
		age = todayYear - birthYear; 

		if (todayMonth < birthMonth - 1) age--;
		if (todayMonth == birthMonth - 1 && todayDay < birthDay) age--;

		return age;	
	} else {
		return "";
	}
}


function updateDOM() {
	/*********************************************************************/
	/******** Writes data about a selected senior user to the DOM ********/
	/******* Values that might be stored as a null value in the db *******/
	/*********************** are checked for this. ***********************/
	/*********************************************************************/
	if ($activeUserData !== null) {
		$fullName = $activeUserData.firstName + " " + $activeUserData.lastName;
		$genderStr = ($activeUserData.isMale == 1) ? 'Mann' :'Kvinne';

		$usesWalkingAidBool = ($activeUserData.usesWalkingAid == 1);
		$usesWalkingAidStr = ($usesWalkingAidBool) ? 'Ja' :'Nei';

		$livingIndependentlyBool = ($activeUserData.livingIndependently == 1);
		$livingIndependentlyStr = ($livingIndependentlyBool) ? 'Ja' :'Nei';

		
		/******** Update user detail page ********/

		$("#activeUserFullName").html($fullName);
		$("#headerTitleDetailPage").html("Brukerdetaljer - " + $fullName);

		$("#cellBalanceIdx").html($activeUserData.balanceIdx);
		$("#cellActivityIdx").html($activeUserData.activityIdx);

		$age = calculateAge($activeUserData.birthDate);
		if ($age != "") {
			$("#cellBirthDate").html($activeUserData.birthDate + " (" + $age + " år)");
		}

		// Builds a string containing the full address for the user
		// (address (street name and number) + zip + city),
		// taking into account that some parts of it might not be set.
		$fullAddress = "";
		$isZipSet = false;
		if ($activeUserData.address !== null) {
			$fullAddress += $activeUserData.address;
		}
		if ($activeUserData.zipCode !== null) {
			$isZipSet = true;
			if ($fullAddress != "") {
				$fullAddress += ", ";
			}
			$fullAddress += $activeUserData.zipCode + " ";
		}
		if ($activeUserData.city !== null) {
			if ($fullAddress != "") {
				if ($isZipSet) {
					$fullAddress += " ";
				} else {
					$fullAddress += ", ";
				}
			}
			$fullAddress += $activeUserData.city;
		}


		// Generate links
		$addressLink = "";
		$emailLink = "";
		$phoneLink = "";

		if ($fullAddress != "") {
			$addressLink = "<a href='http://maps.google.no/?q="
				+ $fullAddress + "' target='_blank'>"
				+ $fullAddress + "</a>";
		}

		if ($activeUserData.email && $activeUserData.email !== "") {
			$emailLink = "<a href='mailto:" + $activeUserData.email 
				+ "' target='_blank'>" + $activeUserData.email + "</a>";
		} else {
			$emailLink = "";
			$activeUserData.email = "";
		}

		if ($activeUserData.phoneNumber &&$activeUserData.phoneNumber !== "") {
			$phoneLink = "<a href='tel:" + $activeUserData.phoneNumber 
				+ "' target='_blank'>" + $activeUserData.phoneNumber  + "</a>";
		} else {
			$phoneLink = "";
			$activeUserData.phoneNumber = "";
		}


		// Insert values into user details table and edit user data form

		$("#inputFieldEditFirstName").val($activeUserData.firstName);
		$("#inputFieldEditLastName").val($activeUserData.lastName);
		$("#inputFieldEditUsername").val($activeUserData.username);

		$("#cellAddress").html($addressLink);
		$("#inputFieldEditAddress").val($activeUserData.address);
		$("#inputFieldEditZipCode").val($activeUserData.zipCode);
		$("#inputFieldEditCity").val($activeUserData.city);

		$("#cellEmail").html($emailLink);
		$("#inputFieldEditEmail").val($activeUserData.email);
		
		$("#cellPhoneNr").html($phoneLink);
		$("#inputFieldEditPhone").val($activeUserData.phoneNumber);

		$("#cellDateJoined").html($activeUserData.dateJoinedAdapt);
		
		$("#cellGender").html($genderStr);

		if ($activeUserData.weight !== null) {
			$("#cellWeight").html($activeUserData.weight + " kg");
			$("#inputFieldEditWeight").val($activeUserData.weight);
		}

		if ($activeUserData.height !== null) {
			$("#cellHeight").html($activeUserData.height + " cm");
			$("#inputFieldEditHeight").val($activeUserData.height);
		}
		
		if ($activeUserData.numFalls3Mths !== null) {
			$("#cellFalls3").html($activeUserData.numFalls3Mths);
			$("#inputFieldEditNumFalls3Mths").val($activeUserData.numFalls3Mths);
		}

		if ($activeUserData.numFalls12Mths !== null) {
			$("#cellFall12").html($activeUserData.numFalls12Mths);
			$("#inputFieldEditNumFalls12Mths").val($activeUserData.numFalls12Mths);
		}

		if ($activeUserData.comment !== null) {
			$("#cellComment").html($activeUserData.comment);
			$("#inputFieldEditComment").val($activeUserData.comment);
		}

		if ($activeUserData.AIChartLineValue !== null) {
			$("#cellAIChartLineValue").html($activeUserData.AIChartLineValue);
			$("#inputFieldEditAIChartLineValue").val($activeUserData.AIChartLineValue);
		}
		
		$("#cellWalkingAid").html($usesWalkingAidStr);
		$("#inputFieldEditUsesWalkingAid").prop('checked', $usesWalkingAidBool);

		$("#cellLivingIndependently").html($livingIndependentlyStr);
		$("#inputFieldEditLivingIndependently").prop('checked', $livingIndependentlyBool);


		// SMS receiving phone number
		$("#SMSReceiverField").val($activeUserData.phoneNumber);
	}
}


/*********************************************************************/
/******** Updates the values in the row in the user overview *********/
/************** table corresponding to the active user ***************/
/*********************************************************************/
function updateUsersTableRow() {
	if ($activeUserData) {

		var usersTableRow = findUsersTableRow($activeUserData.userID);

		if (usersTableRow !== null) {
			usersTableRow[0].cells[0].childNodes[0].innerText = $activeUserData.lastName;
			usersTableRow[0].cells[1].childNodes[0].innerText = $activeUserData.firstName;
			usersTableRow[0].cells[2].childNodes[0].innerText = calculateAge($activeUserData.birthDate);
			usersTableRow[0].cells[3].childNodes[0].innerText = $activeUserData.balanceIdx;
			usersTableRow[0].cells[4].childNodes[0].innerText = $activeUserData.activityIdx;
		}
	}
}


/*********************************************************************/
/** Counts the number of characters of a given text, and calculates **/
/* how many SMSes will need to be sent to transfer the whole message,*/
/* and how many characters ramain until a new SMS message will need **/
/**************************** to be sent. ****************************/
/*********************************************************************/
function countSMSChar(val, feedbackID) {
	var len = val.value.length;
	$feedbackElement = $('#' + feedbackID);
	var print;
	if (len <= 1224) {
		var maxLengths = [160,146,153,153,153,153,153,153];
		var tempCounter = 0;
		for (var i=0; i<maxLengths.length; i++) {
			tempCounter += maxLengths[i];
			if (len <= tempCounter) {
				var numSMS = i+1;
				var remainingChars = tempCounter - len;
				var SMSLengthText = numSMS + " SMS";
				if (i>0) {
					SMSLengthText += "er";
				}
				SMSLengthText += ", " + remainingChars + " tegn til neste melding."
				$feedbackElement.text(SMSLengthText);
				break;
			}
		}
	} else {
		$feedbackElement.text("Meldingen er for lang!");
	}
};


/*********************************************************************/
/* Checks if a given number is a valid Norwegian mobile phone number */
/*********************************************************************/
function validMobilePhoneNumber(phoneNumber) {
	return ((phoneNumber >= 40000000 && phoneNumber <= 49999999) ||
		phoneNumber >= 90000000 && phoneNumber <= 99999999)
}


/*********************************************************************/
/***** Inserts the users and their phone number as values for the ****/
/** checkboxes on the page for sending SMSes to multiple recipients. */
/*********************************************************************/
function populateSMSCheckboxes() {
	var html = "";
	for (var i=0; i<userOverview.length; i++) {
		var phoneNumber = userOverview[i].phoneNumber;
		if (phoneNumber !== null && phoneNumber.trim() !== "") {
			html += "<input type='checkbox' name='phone[]' id='SMSRecipientCheckbox-" + i + "' value='" + phoneNumber + "'>"
				+ "<label for='SMSRecipientCheckbox-" + i + "'>" + userOverview[i].firstName + " " + userOverview[i].lastName + "</label>"
		}
	}

	$("#SMSRecipientCheckboxGroup").append(html);
}


function findUsersTableRow(userID) {
	var idName = "userRow" + userID;
	var res = null;
	$('#usersTable tbody tr').each(function() {
		if ($(this).attr('id') === idName) {
			res = $(this);
		}
	});
	return res;
}