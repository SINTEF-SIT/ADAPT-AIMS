//********************************************************************
//          Sets the default jQuery mobile page transition
//********************************************************************
$(document).bind("mobileinit", function(){
	$.mobile.defaultPageTransition = "slidefade";
});



//********************************************************************
//     Every time the user detail page is shown: reflow the charts 
//      in case the window size has changed while on another page 
//********************************************************************
$(document).delegate('#user-detail-page', 'pageshow', function () {
	if (activeUser !== null) {
		if (balanceChart !== null) balanceChart.reflow();
		if (activityChart !== null) activityChart.reflow();
	}
});


//********************************************************************
//      Disable the flip switches on personalized-feedback-page 
//                     if no messages are present
//********************************************************************
$(document).on("pagebeforeshow", "#personalized-feedback-page", function () {
	if (activeUser) {
		if (activeUser.feedbackCustomBI && activeUser.feedbackCustomBI.length > 0) {
			$("#flipPersonalizedBI").flipswitch("enable");
		} else {
			$("#flipPersonalizedBI").flipswitch("disable");
		}
		if (activeUser.feedbackCustomAISitting && activeUser.feedbackCustomAISitting.length > 0) {
			$("#flipPersonalizedAISitting").flipswitch("enable");
		} else {
			$("#flipPersonalizedAISitting").flipswitch("disable");
		}
		if (activeUser.feedbackCustomAIWalking && activeUser.feedbackCustomAIWalking.length > 0) {
			$("#flipPersonalizedAIWalking").flipswitch("enable");
		} else {
			$("#flipPersonalizedAIWalking").flipswitch("disable");
		}
	}

	// Sets current values to the flip switches on personalized-feedback-page
	var showPersonalizedBIFeedbackStr = activeUser.userData.showPersonalizedBIFeedback ? '1' : '0';
	var showPersonalizedAISittingFeedbackStr = activeUser.userData.showPersonalizedAISittingFeedback ? '1' : '0';
	var showPersonalizedAIWalkingFeedbackStr = activeUser.userData.showPersonalizedAIWalkingFeedback ? '1' : '0';

	$("#flipPersonalizedBI")
		.off("change")
		.val(showPersonalizedBIFeedbackStr)
		.flipswitch('refresh')
		.on("change", BIFlipChanged);

	$("#flipPersonalizedAISitting")
		.off("change")
		.val(showPersonalizedAISittingFeedbackStr)
		.flipswitch('refresh')
		.on("change", AISittingFlipChanged);

	$("#flipPersonalizedAIWalking")
		.off("change")
		.val(showPersonalizedAIWalkingFeedbackStr)
		.flipswitch('refresh')
		.on("change", AIWalkingFlipChanged);
});



//********************************************************************
//      Adds all DOM event listeners that are to take effect 
//                     once the document is ready 
//********************************************************************
function initEventListenersDocumentReady() {
	// Selects all SMS recipients
	$("#selectAllSMSRecipients").click(function() { 
		$("INPUT[name='phone[]']").prop('checked', true).checkboxradio('refresh');
		return false;
	});

	// Selects no SMS recipients
	$("#selectNoSMSRecipients").click(function() {
		$("INPUT[name='phone[]']").prop('checked', false).checkboxradio('refresh');
		return false;
	});


	//********************************************************************
	//            Submit form for storing new balance index
	//********************************************************************
	$("#balanceIdxForm").submit(function(e){
		if ($('#balanceIdxToDatePicker').val() > $('#balanceIdxFromDatePicker').val()) {
			showLoader(); // Shows the loading widget

			// Fetch the BI form value from the DOM
			$balanceIdxValue = $('#balanceIdxInputField').val();

			// Serialize the form data and append the senior user ID
			formData = $("#balanceIdxForm").serialize();
			formData += "&userID=" + activeUser.userData.userID;

			writeNewBI(formData, false);

			// Check if a BI value is already registered for the given date
			/*var match = null;
			if (activeUser.balanceIndexes) {
				for (var i=0; i<activeUser.balanceIndexes.length; i++) {
					if (activeUser.balanceIndexes[i].dateFrom == $("#balanceIdxFromDatePicker").val()) {
						match = activeUser.balanceIndexes[i];
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
				$("#overwriteBIDialogDate").html(match.dateFrom);
				$("#overwriteBIDialogNewValue").html($balanceIdxValue);
				
				$.mobile.changePage( "index.html#confirm-overwrite-bi-dialog", { transition: "pop" });
			}*/
		} else {
			showToast("#toastRegisterDataPage", false, "Til-dato må være etter fra-dato!", 3000); // Shows toast with error msg
		}
		refreshUI();
		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//            Submit form for storing new activity index
	//********************************************************************
	$("#activityIdxForm").submit(function(e){
		if ($('#activityIdxToDatePicker').val() > $('#activityIdxFromDatePicker').val()) {
			showLoader(); // Shows the loading widget

			// Fetch the AI form value from the DOM
			$activityIdxValue = $('#activityIdxInputField').val();

			// Serialize the form data and append the senior user ID
			formData = $("#activityIdxForm").serialize();
			formData += "&userID=" + activeUser.userData.userID;

			writeNewAI(formData, false);
			
			// Check if an AI value is already registered for the given date
			/*var match = null;
			if (activeUser.activityIndexes) {
				for (var i=0; i<activeUser.activityIndexes.length; i++) {
					if (activeUser.activityIndexes[i].dateFrom == $("#activityIdxFromDatePicker").val()) {
						match = activeUser.activityIndexes[i];
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
				$("#overwriteAIDialogDate").html(match.dateFrom);
				$("#overwriteAIDialogNewValue").html($activityIdxValue);
				
				$.mobile.changePage( "index.html#confirm-overwrite-ai-dialog", { transition: "pop" });
			}*/
		} else {
			showToast("#toastRegisterDataPage", false, "Til-dato må være etter fra-dato!", 3000); // Shows toast with error msg
		}
		refreshUI();
		return false; // Returns false to stop the default form behaviour
	});
	


	//********************************************************************
	//      Submit form for storing new custom BI feedback message
	//********************************************************************
	$("#registerPersonalizedBIFeedbackForm").submit(function(e){
		showLoader(); // Shows the loading widget
		formData = $("#registerPersonalizedBIFeedbackForm").serialize(); // Serialize the form data
		
		// Calls the API to store the new feedback msg
		submitCustomFeedbackMsg(formData, "#toastPersonalizedFeedback", false, null, activeUser.userData.showPersonalizedBIFeedback);
		
		$('#textareaPersonalizedBIFeedback').val(""); // Empties the feedback input field
		return false; // Returns false to stop the default form behaviour
	});
	


	//********************************************************************
	//      Submit form for storing new custom AI feedback message 
	//							about sitting less
	//********************************************************************
	$("#registerPersonalizedAIFeedbackSittingForm").submit(function(e){
		showLoader(); // Shows the loading widget
		formData = $("#registerPersonalizedAIFeedbackSittingForm").serialize(); // Serialize the form data
		
		// Calls the API to store the new feedback msg
		submitCustomFeedbackMsg(formData, "#toastPersonalizedFeedback", true, 0, activeUser.userData.showPersonalizedAISittingFeedback);
		
		$('#textareaPersonalizedAISittingFeedback').val(""); // Empties the feedback input field
		return false; // Returns false to stop the default form behaviour
	});
	


	//********************************************************************
	//      Submit form for storing new custom AI feedback message 
	//							about walking more
	//********************************************************************
	$("#registerPersonalizedAIFeedbackWalkingForm").submit(function(e){
		showLoader(); // Shows the loading widget
		formData = $("#registerPersonalizedAIFeedbackWalkingForm").serialize(); // Serialize the form data
		
		// Calls the API to store the new feedback msg
		submitCustomFeedbackMsg(formData, "#toastPersonalizedFeedback", true, 1, activeUser.userData.showPersonalizedAIWalkingFeedback);
		
		$('#textareaPersonalizedAIWalkingFeedback').val(""); // Empties the feedback input field
		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//                Submit form for updating user data 
	//********************************************************************
	$("#editUserDataForm").submit(function(e){
		var editPhoneNumber = $("#inputFieldEditPhone").val();
		if (editPhoneNumber === null || editPhoneNumber === "" || validMobilePhoneNumber(editPhoneNumber)) {
			showLoader(); // Shows the loading widget

			var username = $("#inputFieldEditUsername").val();
			var usernameUnique = false;
				
			// Serialize the form data and append the senior user ID
			formData = $("#editUserDataForm").serialize();
			formData += "&seniorUserID=" + activeUser.userData.userID;

			$.when($.ajax({
				type: "GET",
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				url: "../api/checkUsernameAvailability.php?username=" + username,
				success: function(data, status) { // If the API request is successful
					
					if (data.data) {
						if (data.data == -1 || data.data == activeUser.userData.userID) {
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
								activeUser.userData.firstName = $("#inputFieldEditFirstName").val();
								activeUser.userData.lastName = $("#inputFieldEditLastName").val();
								activeUser.userData.username = $("#inputFieldEditUsername").val();
								activeUser.userData.address = $("#inputFieldEditAddress").val();
								activeUser.userData.zipCode = $("#inputFieldEditZipCode").val();
								activeUser.userData.city = $("#inputFieldEditCity").val();
								activeUser.userData.email = $("#inputFieldEditEmail").val();
								activeUser.userData.phoneNumber = $("#inputFieldEditPhone").val();
								activeUser.userData.weight = $("#inputFieldEditWeight").val();
								activeUser.userData.height = $("#inputFieldEditHeight").val();
								activeUser.userData.numFalls3Mths = $("#inputFieldEditNumFalls3Mths").val();
								activeUser.userData.numFalls12Mths = $("#inputFieldEditNumFalls12Mths").val();
								activeUser.userData.AIChartLineValue = $("#inputFieldEditAIChartLineValue").val();
								activeUser.userData.comment = $("#inputFieldEditComment").val();
								activeUser.userData.usesWalkingAid = $("#inputFieldEditUsesWalkingAid").val();
								activeUser.userData.livingIndependently = $("#inputFieldEditLivingIndependently").val();

								setActiveUser(activeUser.userData.userID, false); // Sets the active user, which in turn updates the DOM with new user data
								updateUsersTableRow(); // Updates the values in the row in the user overview table corresponding to the active user

								showToast("#toastEditUserDataForm", true, data.status_message, 3000); // Shows toast with success msg
							} else {
								showToast("#toastEditUserDataForm", false, data.status_message, 3000); // Shows toast with error msg
							}
							hideLoader(); // Hides the loading widget
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
	//              Submit form for adding new senior user
	//********************************************************************
	$("#newUserForm").submit(function(e){
		var newPhoneNumber = $("#inputFieldEditPhone").val();
		if (newPhoneNumber === null || newPhoneNumber === "" || validMobilePhoneNumber(newPhoneNumber)) {
			submitNewUser();
		} else {
			showToast("#toastNewUserForm", false, "Det oppgitte mobilnummeret er ugyldig.", 3000); // Shows toast with error msg
		}

		// Returns false to stop the default form behaviour
		return false;
	});
	


	//********************************************************************
	//         Submit form for updating default feedback messages
	//********************************************************************
	$("#registerDefaultFeedbackForm").submit(function(e){
		submitDefaultFeedbackMsg();
		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//            Submit form for sending multiple SMS messages
	//********************************************************************
	$("#sendBulkSMSForm").submit(function(e){
		if ($("#bulkSMSContentField").val().length <= 1224) {

			// Check that at least on recipient is selected
			var recipientFound = false;
			for (var i=0; i<seniorUsers.length; i++) {
				if ($("#SMSRecipientCheckbox-" + i).is(':checked')) {
					recipientFound = true;
					break;
				}
			}

			if (recipientFound) {
				var formData = $("#sendBulkSMSForm").serialize(); // Serialize the form data
				formData = formData.replace(/%5B%5D/g, "[]");

				sendBulkSMS(formData);
			} else {
				showToast("#toastSendBulkSMS", false, "Velg minst én mottaker!", 3000); // Shows toast with error msg
			}
		} else {
			showToast("#toastSendBulkSMS", false, "Meldingen er for lang!", 3000); // Shows toast with error msg
		}

		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//            Submit form for sending a single SMS message
	//********************************************************************
	$("#sendSingleSMSForm").submit(function(e){
		showLoader(); // Shows the loading widget
		if ($("#singleSMSContentField").val().length <= 1224) {
			var formData = $("#sendSingleSMSForm").serialize(); // Serialize the form data
			sendSingleSMS(formData);
		} else {
			showToast("#toastSendSingleSMS", false, "Meldingen er for lang!", 3000); // Shows toast with error msg
		}

		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//              Submit form for updating general settings
	//********************************************************************
	$("#settingsForm").submit(function(e){
		showLoader(); // Shows the loading widget
		$BIThresholdUpperInput = $("#BIThresholdUpperInput").val();
		$BIThresholdLowerInput = $("#BIThresholdLowerInput").val();
		if (parseFloat($BIThresholdUpperInput) > parseFloat($BIThresholdLowerInput)) {
			var formData = $("#settingsForm").serialize(); // Serialize the form data
			submitSettings(formData);
		} else {
			showToast("#toastSettingsForm", false, "Øvre grenseverdi for BI må være høyere enn den nedre!", 3000); // Shows toast with error msg
		}

		return false; // Returns false to stop the default form behaviour
	});
}


//********************************************************************
//			Called when custom BI feedback is turned on or off
//********************************************************************
function BIFlipChanged(e) {
	var flipSwitchStateBit = this.value;
	var flipSwitchStateBool = (flipSwitchStateBit === "1");
	
	if (flipSwitchStateBool !== activeUser.userData.showPersonalizedBIFeedback) {
		setShowCustomFeedback(flipSwitchStateBit, 1, null, true);
	}
}


//********************************************************************
//			Called when custom AI feedback about sitting less
//						   is turned on or off
//********************************************************************
function AISittingFlipChanged(e) {
	var flipSwitchStateBit = this.value;
	var flipSwitchStateBool = (flipSwitchStateBit === "1");
	
	if (flipSwitchStateBool !== activeUser.userData.showPersonalizedAISittingFeedback) {
		setShowCustomFeedback(flipSwitchStateBit, 0, 0, true);
	}
}


//********************************************************************
//			Called when custom AI feedback about walking more
//						   is turned on or off
//********************************************************************
function AIWalkingFlipChanged(e) {
	var flipSwitchStateBit = this.value;
	var flipSwitchStateBool = (flipSwitchStateBit === "1");
	
	if (flipSwitchStateBool !== activeUser.userData.showPersonalizedAIWalkingFeedback) {
		setShowCustomFeedback(flipSwitchStateBit, 0, 1, true);
	}
}