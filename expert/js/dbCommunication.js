//********************************************************************
//     Fetches data about the senior users that the expert user
//   has access to from the DB, and other data needed in the system.
//********************************************************************
function getData() {
	showLoader(); // Shows the loading widget
	$.ajax({
		url: "../api/allExpertData.php",
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) {
			console.log("Error fetching data from API allExpertData.");
			hideLoader(); // Hides the loading widget
		},
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				seniorUsers = data.data.seniorUsers;
				exerciseGroups = data.data.exerciseGroups;
				feedbackDefault = data.data.feedbackDefault;
				feedbackDefaultAll = data.data.feedbackDefaultAll;
				if (data.data.feedbackCustomLog !== null) {
					feedbackCustomLog = data.data.feedbackCustomLog;
				} else {
					feedbackCustomLog = [];
				}

				if (seniorUsers !== null) { // Checks that the API call returned data
					
					for (var i=0; i<seniorUsers.length; i++) {
						var userData = seniorUsers[i].userData;

						// Convert bit value to boolean
						userData.showPersonalizedBIFeedback = (userData.showPersonalizedBIFeedback == "1" ? true : false);
						userData.showPersonalizedAISittingFeedback = (userData.showPersonalizedAISittingFeedback == "1" ? true : false);
						userData.showPersonalizedAIWalkingFeedback = (userData.showPersonalizedAIWalkingFeedback == "1" ? true : false);

						// Store newest AI and BI value separately
						var balanceIdxs = seniorUsers[i].balanceIndexes;
						var actitivyIdxs = seniorUsers[i].activityIndexes;
						userData.balanceIdx = (balanceIdxs) ? balanceIdxs[balanceIdxs.length-1].value : null;
						userData.activityIdx = (actitivyIdxs) ? actitivyIdxs[actitivyIdxs.length-1].value : null;
					}

					separateCustomFeedbackTypes(); // Separates custom AI and BI feedback

					// Functions for populating DOM with data. All placed in separate file populateDOM.js
					populateUsersTable();
					populateSMSCheckboxes();
					populateDefaultFeedbackTables();

					// BI threshold settings
					settings = data.data.settings;
					$("#BIThresholdUpperInput").val(settings.BIThresholdUpper);
					$("#BIThresholdLowerInput").val(settings.BIThresholdLower);
					$("#maxXAxisIntervalDaysInput").val(settings.maxXAxisIntervalDays);
					$("#BIImgHeaderInput").val(settings.BIImgHeader);
					$("#BIChartHeaderInput").val(settings.BIChartHeader);
					$("#AIChartHeaderInput").val(settings.AIChartHeader);
					$("#BIImgLabelLowInput").val(settings.BIImgLabelLow);
					$("#BIImgLabelHighInput").val(settings.BIImgLabelHigh);
					$("#BIChartSpectrumLabelLowInput").val(settings.BIChartSpectrumLabelLow);
					$("#BIChartSpectrumLabelMediumInput").val(settings.BIChartSpectrumLabelMedium);
					$("#BIChartSpectrumLabelHighInput").val(settings.BIChartSpectrumLabelHigh);
					$("#BIChartLineTextInput").val(settings.BIChartLineText);
					$("#AIChartLineTextInput").val(settings.AIChartLineText);
					$("#BIImgHelpTooltipTextInput").val(settings.BIImgHelpTooltipText);
					$("#BIChartHelpTooltipTextInput").val(settings.BIChartHelpTooltipText);
					$("#AIChartHelpTooltipTextInput").val(settings.AIChartHelpTooltipText);

					hideLoader(); // Hides the loading widget

				} else {
					console.log("No user data returned from API.");
					hideLoader(); // Hides the loading widget
				}
			} else {
				console.log("Error loading data through API. " + data);
				hideLoader(); // Hides the loading widget
			}
	
		}
	});
}


//********************************************************************
//     			Writes a new senior user to the db
//********************************************************************
function submitNewUser() {
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
						getData(); // Updates the DOM with new data from db
						document.getElementById("newUserForm").reset(); // Clears all the input fields in the new user form
						showToast("#toastMainPage", true, data.status_message, 3000);
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
}


//********************************************************************
//                   Writes new/updates BI to DB
//********************************************************************
function writeNewBI(formData, update) {
	showLoader(); // Shows the loading widget

	// Calls different API depending on whether the data is 
	// stored as a new entry, or updating an existing entry
	var requestType = (update ? "PUT" : "POST");

	var customFeedbackOnBit = (activeUser.userData.showPersonalizedBIFeedback) ? 1 : 0;
	formData += "&customFeedbackOn=" + customFeedbackOnBit;

	// Find current custom BI feedback msg (if any)
	var currentCustomFeedbackMsgID = null;
	if (activeUser.feedbackCustom !== null) {
		for (var i=0; i<feedbackCustomLog.length && currentCustomFeedbackMsgID === null; i++) {
			if (feedbackCustomLog[i].timeEnd === null) {
				for (var j=0; j<activeUser.feedbackCustom.length; j++) {
					if (feedbackCustomLog[i].msgID === activeUser.feedbackCustom[j].msgID && activeUser.feedbackCustom[j].category === 1) {
						currentCustomFeedbackMsgID = feedbackCustomLog[i].msgID;
						formData += "&currentCustomFeedbackMsgID=" + currentCustomFeedbackMsgID;
						break;
					}
				}
			}
		}
	}
	
	$.ajax({
		type: requestType,
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: "../api/balanceIdx.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				showToast("#toastRegisterDataPage", true, data.status_message, 3000); // Shows toast with success msg

				var newBI = {
					dateFrom: $('#balanceIdxFromDatePicker').val(),
					dateTo: $('#balanceIdxToDatePicker').val(),
					value: parseFloat($('#balanceIdxInputField').val())
				};

				if (activeUser.balanceIndexes === null) {
					activeUser.balanceIndexes = [];
				}
				activeUser.balanceIndexes.push(newBI);
				activeUser.userData.balanceIdx = newBI.value;

				setActiveUser(activeUser.userData.userID, false); // Sets the active user, which in turn updates the active user data and charts
				updateUsersTableRow(); // Updates the values in the row in the user overview table corresponding to the active user

				activeUser.userData.showPersonalizedBIFeedback = false;

				if (currentCustomFeedbackMsgID !== null) {
					for (var i=0; i<feedbackCustomLog.length; i++) {
						if (feedbackCustomLog[i].msgID === currentCustomFeedbackMsgID && feedbackCustomLog[i].timeEnd === null) {
							feedbackCustomLog[i].timeEnd = data.data["timestamp"];
						}
					}
				}

				// Resets the form and displays BI section on custom feedback page if no BI values were set before
				$('#balanceIdxToDatePicker').val("");
				$('#balanceIdxInputField').focus();

				generateFeedbackLog();
			} else {
				showToast("#toastRegisterDataPage", false, data.status_message, 3000); // Shows toast with error msg
			}

			// Resets the form
			$("#balanceIdxFromDatePicker").val($('#balanceIdxToDatePicker').val());
			$('#balanceIdxToDatePicker').val("");
			$('#balanceIdxInputField').val("");
			$('#balanceIdxInputField').focus();

			hideLoader(); // Hides the loading widget
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast("#toastRegisterDataPage", false, data.status_message, 3000); // Shows toast with error msg
		}
	});
}

//********************************************************************
//                   Writes new/updates BI to DB
//********************************************************************
function writeNewAI(formData, update) {
	showLoader(); // Shows the loading widget

	// Calls different API depending on whether the data is 
	// stored as a new entry, or updating an existing entry
	var requestType = (update ? "PUT" : "POST"); 

	var customSittingFeedbackOnBit = (activeUser.userData.showPersonalizedAISittingFeedback) ? 1 : 0;
	var customWalkingFeedbackOnBit = (activeUser.userData.showPersonalizedAIWalkingFeedback) ? 1 : 0;
	formData += "&customSittingFeedbackOn=" + customSittingFeedbackOnBit + "&customWalkingFeedbackOn=" + customWalkingFeedbackOnBit;
	
	var currentCustomSittingFeedbackMsgID = null;
	var currentCustomWalkingFeedbackMsgID = null;
	// Find current custom BI feedback msg (if any)
	if (activeUser.feedbackCustom !== null) {
		for (var i=0; i<feedbackCustomLog.length; i++) {
			if (feedbackCustomLog[i].timeEnd === null) {
				for (var j=0; j<activeUser.feedbackCustom.length; j++) {
					if (feedbackCustomLog[i].msgID === activeUser.feedbackCustom[j].msgID && activeUser.feedbackCustom[j].category === 0 && activeUser.feedbackCustom[j].AIFeedbackType === 0) {
						currentCustomSittingFeedbackMsgID = feedbackCustomLog[i].msgID;
						formData += "&currentCustomSittingFeedbackMsgID=" + feedbackCustomLog[i].msgID;
						break;
					}
					if (feedbackCustomLog[i].msgID === activeUser.feedbackCustom[j].msgID && activeUser.feedbackCustom[j].category === 0 && activeUser.feedbackCustom[j].AIFeedbackType === 1) {
						currentCustomWalkingFeedbackMsgID = feedbackCustomLog[i].msgID;
						formData += "&currentCustomWalkingFeedbackMsgID=" + feedbackCustomLog[i].msgID;
						break;
					}
				}
			}
			if (currentCustomSittingFeedbackMsgID !== null && currentCustomWalkingFeedbackMsgID !== null) break;
		}
	}

	$.ajax({
		type: requestType,
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: "../api/activityIdx.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				showToast("#toastRegisterDataPage", true, data.status_message, 3000); // Shows toast with success msg

				var newAI = {
					dateFrom: $('#activityIdxFromDatePicker').val(),
					dateTo: $('#activityIdxToDatePicker').val(),
					value: parseFloat($('#activityIdxInputField').val())
				};
				if (activeUser.activityIndexes === null) {
					activeUser.activityIndexes = [];
				}
				activeUser.activityIndexes.push(newAI);
				activeUser.userData.activityIdx = newAI.value;

				setActiveUser(activeUser.userData.userID, false); // Sets the active user, which in turn updates the active user data and charts
				updateUsersTableRow(); // Updates the values in the row in the user overview table corresponding to the active user

				activeUser.userData.showPersonalizedAISittingFeedback = false;
				activeUser.userData.showPersonalizedAIWalkingFeedback = false;

				if (currentCustomSittingFeedbackMsgID !== null) {
					for (var i=0; i<feedbackCustomLog.length; i++) {
						if (feedbackCustomLog[i].msgID === currentCustomSittingFeedbackMsgID && feedbackCustomLog[i].timeEnd === null) {
							feedbackCustomLog[i].timeEnd = data.data["timestamp"];
						}
					}
				}

				if (currentCustomWalkingFeedbackMsgID !== null) {
					for (var i=0; i<feedbackCustomLog.length; i++) {
						if (feedbackCustomLog[i].msgID === currentCustomWalkingFeedbackMsgID && feedbackCustomLog[i].timeEnd === null) {
							feedbackCustomLog[i].timeEnd = data.data["timestamp"];
						}
					}
				}

				// Resets the form and displays AI section on custom feedback page if no AI values were set before
				$('#activityIdxToDatePicker').val("");
				$('#activityIdxInputField').focus();

				generateFeedbackLog();
			} else {
				showToast("#toastRegisterDataPage", false, data.status_message, 3000); // Shows toast with error msg
			}

			hideLoader(); // Hides the loading widget
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast("#toastRegisterDataPage", false, data.status_message, 3000); // Shows toast with error msg
		}
	});
}


//********************************************************************
//           Calls API to set a senior user as inactive.
//       Inactive users are not displayed in the expert view.
//********************************************************************
function deleteUser() {
	showLoader(); // Shows the loading widget
	userID = activeUser.userData.userID;
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

			var usersTableRow = findUsersTableRow(activeUser.userData.userID);
			usersTableRow.remove();

			$.mobile.back(); // Returns to the main page
		}
	});
}



//********************************************************************
//               Deletes a custom feedback message
//********************************************************************
/*function deleteFeedbackMsg(msgID, category, AIFeedbackType) {
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
				for (var i=0; i<activeUser.feedbackCustom.length; i++) {
					if (activeUser.feedbackCustom[i].msgID === msgID) {
						activeUser.feedbackCustom.splice(i, 1);
					}
				}

				// Disables the flip switch if the deleted message is the last of its category
				if (category === 1 && activeUser.feedbackCustomBI.length === 1) { // BI
					$("#flipPersonalizedBI").flipswitch("disable");
					
					if ($('#flipPersonalizedBI').val() === "1") {
						// Disables custom feedback for this user
						$("#flipPersonalizedBI")
							.off("change")
							.val("off")
							.flipswitch('refresh'); // Flip switch state is changed without causing listener to handle event
						setShowCustomFeedback('0', 1, null, false);
					}
				} else if (category === 0 && AIFeedbackType === 0 && activeUser.feedbackCustomAISitting.length === 1) { // AI, sitting less
					$("#flipPersonalizedAISitting").flipswitch("disable");
					
					if ($('#flipPersonalizedAISitting').val() === "1") {
						// Disables custom feedback for this user
						$("#flipPersonalizedAISitting")
							.off("change")
							.val("off")
							.flipswitch('refresh'); // Flip switch state is changed without causing listener to handle event
						setShowCustomFeedback('0', 0, 0, false);
					}
				} else if (category === 0 && AIFeedbackType === 1 && activeUser.feedbackCustomAIWalking.length === 1) { // AI, walking more
					$("#flipPersonalizedAIWalking").flipswitch("disable");
					
					if ($('#flipPersonalizedAIWalking').val() === "1") {
						// Disables custom feedback for this user
						$("#flipPersonalizedAIWalking")
							.off("change")
							.val("off")
							.flipswitch('refresh'); // Flip switch state is changed without causing listener to handle event
						setShowCustomFeedback('0', 0, 1, false);
					}
				}
				
				// Replaces the contents of the AI and BI custom feedback arrays with a set of messages no longer containing the deleted message
				separateCustomFeedbackTypes();

				// Populates the custom feedback tables with the new message
				populateCustomFeedbackTables();

				hideLoader();

			}
		});
	}
}*/

//********************************************************************
//      Call API with a submitted personalized feedback message
//********************************************************************
function submitCustomFeedbackMsg(formData, toastID, isAI, AIFeedbackType, customFeedbackOn) {
	// Append the senior user ID to the form data
	formData += "&userID=" + activeUser.userData.userID;
	
	$customFeedbackOnBit = (customFeedbackOn) ? "1" : "0";
	formData += "&customFeedbackOn=" + $customFeedbackOnBit;
	
	$.ajax({
		type: "POST",
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: "../api/feedbackCustom.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				var balanceExerciseID = null;
				var strengthExerciseID = null;
				var comment = null;

				// Enables flip switch and sets change listener, in case listener was removed when all AI msgs was deleted
				if (isAI) {
					if (AIFeedbackType === 0) {
						$("#flipPersonalizedAISitting").flipswitch("enable");
						comment = $("#personalizedAISittingFeedbackComment").val();
						$("#personalizedAISittingFeedbackComment").val("");
					} else {
						$("#flipPersonalizedAIWalking").flipswitch("enable");
						comment = $("#personalizedAIWalkingFeedbackComment").val();
						$("#personalizedAIWalkingFeedbackComment").val("");
					}
				} else {
					$("#flipPersonalizedBI").flipswitch("enable");
					comment = $("#personalizedBIFeedbackComment").val();
					$("#personalizedBIFeedbackComment").val("");

					balanceExerciseID = (!isAI) ? parseInt($("#selectPersonalizedBIFeedbackBalanceExercise").val()) : null;
					strengthExerciseID = (!isAI) ? parseInt($("#selectPersonalizedBIFeedbackStrengthExercise").val()) : null;
				}

				categoryBit = isAI ? 0 : 1;

				var msgObj = {
					msgID: data.data['msgID'],
					timeCreated: data.data['timeCreated'],
					feedbackText: data.data['feedbackText'],
					category: categoryBit,
					AIFeedbackType: AIFeedbackType,
					balanceExerciseID: balanceExerciseID,
					strengthExerciseID: strengthExerciseID,
					userID: activeUser.userData.userID,
					internalComment: comment
				};

				if (activeUser.feedbackCustom) {
					activeUser.feedbackCustom.unshift(msgObj);	
				} else {
					activeUser.feedbackCustom = [msgObj];
				}


				// Update log
				if (customFeedbackOn) {
					if (data.data['oldLogMsgID'] !== null) {
						for (var i=0; i<feedbackCustomLog.length; i++) {
							if (feedbackCustomLog[i].msgID === data.data['oldLogMsgID']) {
								feedbackCustomLog[i].timeEnd = data.data['timeCreated'];
							}
						}
					}

					var logObj = {
						msgID: data.data['msgID'],
						timeStart: data.data['timeCreated'],
						timeEnd: null
					}

					feedbackCustomLog.unshift(logObj);

					generateFeedbackLog();
				}

				separateCustomFeedbackTypes(); // Places the newly generated feedback message into either the AI or BI feedback arrays
				populateCustomFeedbackTables(); // Populates the custom feedback tables with the new message
			}
			showToast(toastID, data.data, data.status_message, 3000); // Shows toast with success/error msg
			hideLoader(); // Hides the loading widget
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast(toastID, false, data.status_message, 3000); // Shows toast with error msg
		}
	});
}


//********************************************************************
//      Call API with a submitted default feedback message
//********************************************************************
function submitDefaultFeedbackMsg() {
	showLoader(); // Shows the loading widget
	formData = $("#registerDefaultFeedbackForm").serialize(); // Serialize the form data

	$.ajax({
		type: "POST",
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: "../api/feedbackDefault.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				showToast("#toastDefaultFeedbackForm", true, data.status_message, 3000); // Shows toast with success msg
				var changedFeedback = data.data;
				for (var i=0; i<changedFeedback.length; i++) {
					feedbackDefaultAll.push(changedFeedback[i].newRecord);
					for (var j=0; j<feedbackDefault.length; j++) {
						if (changedFeedback[i].oldRecord.msgID === feedbackDefault[j].msgID) {
							feedbackDefault[j] = changedFeedback[i].newRecord;
							break;
						}
					}
				}
				populateDefaultFeedbackTables();
				generateFeedbackLog();
			} else {
				showToast("#toastDefaultFeedbackForm", false, data.status_message, 3000); // Shows toast with error msg
			}
			hideLoader(); // Hides the loading widget
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast("#toastDefaultFeedbackForm", false, data.status_message, 3000); // Shows toast with error msg
		}
	});
}


//********************************************************************
//      Sends the same SMS message to multiple recipients
//********************************************************************
function sendBulkSMS(formData) {
	showLoader(); // Shows the loading widget
	
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
}


//********************************************************************
//      	Sends a single SMS message to a recipient
//********************************************************************
function sendSingleSMS(formData) {
	showLoader(); // Shows the loading widget

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
}


//********************************************************************
//      		Sends updated general settings to DB
//********************************************************************
function submitSettings(formData) {
	showLoader(); // Shows the loading widget
	
	$.ajax({
		type: "PUT",
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		url: "../api/settings.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				showToast("#toastSettingsForm", true, data.status_message, 3000); // Shows toast with success msg
				settings = data.data;
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
}


//********************************************************************
//			Stores to the DB whether custom AI or BI feedback 
//				is enabled for a specific senior user
//********************************************************************
function setShowCustomFeedback(flipSwitchState, category, AIFeedbackType, affectGUI) {
	if (affectGUI) showLoader();

	var url = "../api/feedbackCustom.php?category=" + category
		+ "&seniorUserID=" + activeUser.userData.userID + "&value=" + flipSwitchState;

	if (AIFeedbackType !== null) {
		url += "&AIFeedbackType=" + AIFeedbackType;
	}

	$.ajax({
		url: url,
		type: 'PUT',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) {
			console.log("Error accessing API: PUT request to feedbackCustom.php with parameter category=" + category + " and seniorUserID=" 
				+ activeUser.userData.userID);

			if (affectGUI) {
				showToast("#toastPersonalizedFeedback", false, "Det oppstod en feil under skriving til databasen.", 3000);
				hideLoader(); // Hides the loading widget
			}
		}, 
		success: function(data, status) { // If the API request is successful
			var toastSuccessText = (flipSwitchState === "1") ? "på" : "av";
			var typeStr = (category === 0) ? "AI" : "BI";

			if (category === 1) { // BI
				activeUser.userData.showPersonalizedBIFeedback = (flipSwitchState === "1");
			} else if (AIFeedbackType === 0) { // AI, sitting less
				activeUser.userData.showPersonalizedAISittingFeedback = (flipSwitchState === "1");
			} else { // AI, walking more
				activeUser.userData.showPersonalizedAIWalkingFeedback = (flipSwitchState === "1");
			}

			// Update log
			if (data.data['msgID'] !== null) {
				if (flipSwitchState === "1") {
					var logObj = {
					msgID: data.data['msgID'],
					timeStart: data.data['timestamp'],
					timeEnd: null
				}
				feedbackCustomLog.unshift(logObj);
				} else {
					for (var i=0; i<feedbackCustomLog.length; i++) {
						if (feedbackCustomLog[i].msgID === data.data['msgID']) {
							feedbackCustomLog[i].timeEnd = data.data['timestamp'];
						}
					}
				}
			}

			generateFeedbackLog();

			if (affectGUI) {
				showToast("#toastPersonalizedFeedback", true, "Personaliserte " + typeStr + "-råd er nå " 
					+ toastSuccessText + "slått for denne brukeren.", 3000);
				hideLoader(); // Hides the loading widget
			}
		}
	});
}