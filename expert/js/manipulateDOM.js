//********************************************************************
//  Writes basic data about all senior users to the usersTable in DOM 
//********************************************************************
function populateUsersTable() {
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

	for (var i=0; i<seniorUsers.length; i++) { // Iterates the user data to build a table row for each entry

		// If BI/AI is null, replace it with empty string
		var balanceIdx = (seniorUsers[i].userData.balanceIdx) ? seniorUsers[i].userData.balanceIdx : "";
		var activityIdx = (seniorUsers[i].userData.activityIdx) ? seniorUsers[i].userData.activityIdx : "";

		$age = calculateAge(seniorUsers[i].userData.birthDate); // Calculate the age of the senior user in years

		html += "<tr id='userRow" + seniorUsers[i].userData.userID + "'>"
			+ "<td><a onclick='setActiveUser(" + seniorUsers[i].userData.userID + ",true);'>" + seniorUsers[i].userData.lastName + "</a></td>"
			+ "<td class='ui-table-priority-1'><a onclick='setActiveUser(" + seniorUsers[i].userData.userID + ",true);'>" + seniorUsers[i].userData.firstName + "</a></td>"
			+ "<td class='ui-table-priority-2'><a onclick='setActiveUser(" + seniorUsers[i].userData.userID + ",true);'>" + $age + "</a></td>"
			+ "<td class='ui-table-priority-4'><a onclick='setActiveUser(" + seniorUsers[i].userData.userID + ",true);'>" + balanceIdx + "</a></td>"
			+ "<td class='ui-table-priority-5'><a onclick='setActiveUser(" + seniorUsers[i].userData.userID + ",true);'>" + activityIdx + "</a></td>"
			+ "</tr>";
	}

	html += '</tbody></table>';
	
	$("#usersTable-popup-popup").remove();  
	$('#usersTableContainer').html(html).enhanceWithin();
}


//*********************************************************************
//     Inserts the users and their phone number as values for the
//  checkboxes on the page for sending SMSes to multiple recipients.
//*********************************************************************
function populateSMSCheckboxes() {
	var html = "";
	for (var i=0; i<seniorUsers.length; i++) {
		var phoneNumber = seniorUsers[i].userData.phoneNumber;
		if (phoneNumber !== null && phoneNumber.trim() !== "") {
			html += "<input type='checkbox' name='phone[]' id='SMSRecipientCheckbox-" + i + "' value='" + phoneNumber + "'>"
				+ "<label for='SMSRecipientCheckbox-" + i + "'>" + seniorUsers[i].userData.firstName + " " + seniorUsers[i].userData.lastName + "</label>"
		}
	}

	$("#SMSRecipientCheckboxGroup").append(html);
}


//********************************************************************
//              Writes default feedback messages to DOM
//********************************************************************
function populateDefaultFeedbackTables() {
	if (feedbackDefault !== null) { // Checks that the API call returned data
		// Removes all rows from the feedback table bodies (if any)
		$('#AIDefaultFeedbackTable tbody tr').remove();
		$('#BIDefaultFeedbackTable tbody tr').remove();
		
		var htmlAI = "";
		var htmlBI = "";

		for (var i=0; i<feedbackDefault.length; i++) { // Iterates the messages to build a table row for each message

			var isAI = (feedbackDefault[i].category === 0);
			var categoryTxt = (isAI ? "AI" : "BI");

			// Builds the HTML code for a table row
			var htmlInputFeedback = "<input type='text' name='msg-" + feedbackDefault[i].msgID + "' id='default" + categoryTxt + "FeedbackInput" + feedbackDefault[i].idx + "' value='" + feedbackDefault[i].feedbackText + "' required>";

			if (isAI) {
				var AIFeedbackType = "Å sitte mindre"; // AIFeedbackType = 0
				if (feedbackDefault[i].AIFeedbackType === 1) {
					AIFeedbackType = "Å gå mer";
				}

				htmlAI += "<tr>";
				htmlAI += "<td>" + feedbackDefault[i].idx + "</td>";
				htmlAI += "<td>" + AIFeedbackType + "</td>";
				htmlAI += "<td>" + htmlInputFeedback + "</td>";
				htmlAI += "</tr>";
			} else {
				var BISectionText = "";
				if (feedbackDefault[i].idx === -1) {
					BISectionText = "Lav";
				} else if (feedbackDefault[i].idx === 0) {
					BISectionText = "Medium";
				} else if (feedbackDefault[i].idx === 1) {
					BISectionText = "Høy";
				}

				// Builds the html for the dropdown boxes for selecting balance and strength exercises
				var optionsBalanceExercisesHtml = generateExerciseDropdownOptionHTML(feedbackDefault[i].idx, feedbackDefault[i].balanceExerciseID, 0);
				var optionsStrengthExercisesHtml = generateExerciseDropdownOptionHTML(feedbackDefault[i].idx, feedbackDefault[i].strengthExerciseID, 1);

				htmlBI += "<tr>";
				htmlBI += "<td>" + BISectionText + "</td>";
				htmlBI += "<td>" + htmlInputFeedback + "</td>";
				htmlBI += "<td><select name='balanceExercise-" + feedbackDefault[i].msgID + "'>" + optionsBalanceExercisesHtml + "</select></td>";
				htmlBI += "<td><select name='strengthExercise-" + feedbackDefault[i].msgID + "'>" + optionsStrengthExercisesHtml + "</select></td>";
				htmlBI += "</tr>";
			}
		}

		// Inserts the generated HTML into the DOM
		$("#AIDefaultFeedbackTable tbody").append(htmlAI);
		$("#BIDefaultFeedbackTable tbody").append(htmlBI);

		$("#registerDefaultFeedbackForm").trigger("create");
	} else {
		console.log("No feedback messages returned from API.");
	}
}


//********************************************************************
//        Populates DOM with custom feedback messages (if any)
//********************************************************************
function populateCustomFeedbackTables() {
	// Custom BI feedback
	if (activeUser.feedbackCustomBI && activeUser.feedbackCustomBI.length > 0) {
		// Creates HTML for inserting into BI feedback table
		var htmlBI = '';
		for (var i=0; i<activeUser.feedbackCustomBI.length; i++) {
			var timeCreated = moment(activeUser.feedbackCustomBI[i].timeCreated + "Z");
			timeCreated.tz('Europe/Oslo'); // Converts time to the correct time zone

			var comment = (activeUser.feedbackCustomBI[i].internalComment) ? activeUser.feedbackCustomBI[i].internalComment : "";
			
			htmlBI += "<tr>"
			+ "<td>" + timeCreated.format('YYYY-MM-DD HH:mm') + "</td>"
			+ "<td>" + activeUser.feedbackCustomBI[i].feedbackText + "</td>"
			+ "<td>" + comment + "</td>"
			+ "<td>" + getExerciseTitle(activeUser.feedbackCustomBI[i].balanceExerciseID) + "</td>"
			+ "<td>" + getExerciseTitle(activeUser.feedbackCustomBI[i].strengthExerciseID) + "</td>"
			+ "<td><button data-role='button' data-inline='true' data-mini='true'"
			+ "onclick='deleteFeedbackMsg(" + activeUser.feedbackCustomBI[i].msgID + ",1,null)'>Slett</button>" 
			+ "</td></tr>";
		}
		$('#tablePersonalizedBIFeedbackMsgs tbody').html(htmlBI); // Inserts the generated HTML
		$("#personalizedBIFeedbackMsgsContainer").trigger("create"); // Re-apply jQuery Mobile styles to table
		$('#personalizedBIFeedbackMsgsContainer').show(); // Makes table visible
	} else {
		$('#personalizedBIFeedbackMsgsContainer').hide(); // Hides table
	}

	// Custom AI feedback about sitting less
	if (activeUser.feedbackCustomAISitting && activeUser.feedbackCustomAISitting.length > 0) {
		// Creates HTML for inserting into AI feedback table
		var htmlAISitting = '';
		for (var i=0; i<activeUser.feedbackCustomAISitting.length; i++) {
			var timeCreated = moment(activeUser.feedbackCustomAISitting[i].timeCreated + "Z");
			timeCreated.tz('Europe/Oslo'); // Converts time to the correct time zone

			var comment = (activeUser.feedbackCustomAISitting[i].internalComment) ? activeUser.feedbackCustomAISitting[i].internalComment : "";

			htmlAISitting += "<tr>"
			+ "<td>" + timeCreated.format('YYYY-MM-DD HH:mm') + "</td>"
			+ "<td>" + activeUser.feedbackCustomAISitting[i].feedbackText + "</td>"
			+ "<td>" + comment + "</td>"
			+ "<td><button data-role='button' data-inline='true' data-mini='true'"
			+ "onclick='deleteFeedbackMsg(" + activeUser.feedbackCustomAISitting[i].msgID + ",0,0)'>Slett</button>" 
			+ "</td></tr>";
		}
		$('#tablePersonalizedAIFeedbackMsgsSitting tbody').html(htmlAISitting); // Inserts the generated HTML
		$("#personalizedAIFeedbackMsgsSittingContainer").trigger("create"); // Re-apply jQuery Mobile styles to table
		$('#personalizedAIFeedbackMsgsSittingContainer').show(); // Makes table visible
	} else {
		$('#personalizedAIFeedbackMsgsSittingContainer').hide(); // Hides table
	}

	// Custom AI feedback about walking more
	if (activeUser.feedbackCustomAIWalking && activeUser.feedbackCustomAIWalking.length > 0) {
		// Creates HTML for inserting into AI feedback table
		var htmlAIWalking = '';
		for (var i=0; i<activeUser.feedbackCustomAIWalking.length; i++) {
			var timeCreated = moment(activeUser.feedbackCustomAIWalking[i].timeCreated + "Z");
			timeCreated.tz('Europe/Oslo'); // Converts time to the correct time zone

			var comment = (activeUser.feedbackCustomAIWalking[i].internalComment) ? activeUser.feedbackCustomAIWalking[i].internalComment : "";

			htmlAIWalking += "<tr>"
			+ "<td>" + timeCreated.format('YYYY-MM-DD HH:mm') + "</td>"
			+ "<td>" + activeUser.feedbackCustomAIWalking[i].feedbackText + "</td>"
			+ "<td>" + comment + "</td>"
			+ "<td><button data-role='button' data-inline='true' data-mini='true'"
			+ "onclick='deleteFeedbackMsg(" + activeUser.feedbackCustomAIWalking[i].msgID + ",0,1)'>Slett</button>" 
			+ "</td></tr>";
		}
		$('#tablePersonalizedAIFeedbackMsgsWalking tbody').html(htmlAIWalking); // Inserts the generated HTML
		$("#personalizedAIFeedbackMsgsWalkingContainer").trigger("create"); // Re-apply jQuery Mobile styles to table
		$('#personalizedAIFeedbackMsgsWalkingContainer').show(); // Makes table visible
	} else {
		$('#personalizedAIFeedbackMsgsWalkingContainer').hide(); // Hides table
	}
}


//*********************************************************************
//        Writes data about a selected senior user to the DOM
//       Values that might be stored as a null value in the db
//                       are checked for this.
//*********************************************************************
function updateDOM() {
	if (activeUser !== null) {
		var userData = activeUser.userData;

		$fullName = userData.firstName + " " + userData.lastName;
		$genderStr = (userData.isMale == 1) ? 'Mann' :'Kvinne';

		$usesWalkingAidBool = (userData.usesWalkingAid == 1);
		$usesWalkingAidStr = ($usesWalkingAidBool) ? 'Ja' :'Nei';

		$livingIndependentlyBool = (userData.livingIndependently == 1);
		$livingIndependentlyStr = ($livingIndependentlyBool) ? 'Ja' :'Nei';

		
		/******** Update user detail page ********/

		$("#activeUserFullName").html($fullName);
		$("#headerTitleDetailPage").html("Brukerdetaljer - " + $fullName);

		$("#cellUserID").html(userData.userID);
		$("#cellBalanceIdx").html(userData.balanceIdx);
		$("#cellActivityIdx").html(userData.activityIdx);

		$age = calculateAge(userData.birthDate);
		if ($age != "") {
			$("#cellBirthDate").html(userData.birthDate + " (" + $age + " år)");
		}

		// Builds a string containing the full address for the user
		// (address (street name and number) + zip + city),
		// taking into account that some parts of it might not be set.
		$fullAddress = "";
		$isZipSet = false;
		if (userData.address !== null) {
			$fullAddress += userData.address;
		}
		if (userData.zipCode !== null) {
			$isZipSet = true;
			if ($fullAddress != "") {
				$fullAddress += ", ";
			}
			$fullAddress += userData.zipCode + " ";
		}
		if (userData.city !== null) {
			if ($fullAddress != "") {
				if ($isZipSet) {
					$fullAddress += " ";
				} else {
					$fullAddress += ", ";
				}
			}
			$fullAddress += userData.city;
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

		if (userData.email && userData.email !== "") {
			$emailLink = "<a href='mailto:" + userData.email 
				+ "' target='_blank'>" + userData.email + "</a>";
		} else {
			$emailLink = "";
			userData.email = "";
		}

		if (userData.phoneNumber && userData.phoneNumber !== "") {
			$phoneLink = "<a href='tel:" + userData.phoneNumber 
				+ "' target='_blank'>" + userData.phoneNumber  + "</a>";
		} else {
			$phoneLink = "";
			userData.phoneNumber = "";
		}


		// Insert values into user details table and edit user data form

		$("#inputFieldEditFirstName").val(userData.firstName);
		$("#inputFieldEditLastName").val(userData.lastName);
		$("#inputFieldEditUsername").val(userData.username);

		$("#cellAddress").html($addressLink);
		$("#inputFieldEditAddress").val(userData.address);
		$("#inputFieldEditZipCode").val(userData.zipCode);
		$("#inputFieldEditCity").val(userData.city);

		$("#cellEmail").html($emailLink);
		$("#inputFieldEditEmail").val(userData.email);
		
		$("#cellPhoneNr").html($phoneLink);
		$("#inputFieldEditPhone").val(userData.phoneNumber);

		$("#cellDateJoined").html(userData.dateJoinedAdapt);
		
		$("#cellGender").html($genderStr);

		if (userData.weight !== null) {
			$("#cellWeight").html(userData.weight + " kg");
			$("#inputFieldEditWeight").val(userData.weight);
		}

		if (userData.height !== null) {
			$("#cellHeight").html(userData.height + " cm");
			$("#inputFieldEditHeight").val(userData.height);
		}
		
		if (userData.numFalls3Mths !== null) {
			$("#cellFalls3").html(userData.numFalls3Mths);
			$("#inputFieldEditNumFalls3Mths").val(userData.numFalls3Mths);
		}

		if (userData.numFalls12Mths !== null) {
			$("#cellFall12").html(userData.numFalls12Mths);
			$("#inputFieldEditNumFalls12Mths").val(userData.numFalls12Mths);
		}

		if (userData.comment !== null) {
			$("#cellComment").html(userData.comment);
			$("#inputFieldEditComment").val(userData.comment);
		}

		if (userData.AIChartLineValue !== null) {
			$("#cellAIChartLineValue").html(userData.AIChartLineValue);
			$("#inputFieldEditAIChartLineValue").val(userData.AIChartLineValue);
		}
		
		$("#cellWalkingAid").html($usesWalkingAidStr);
		$("#inputFieldEditUsesWalkingAid").prop('checked', $usesWalkingAidBool);

		$("#cellLivingIndependently").html($livingIndependentlyStr);
		$("#inputFieldEditLivingIndependently").prop('checked', $livingIndependentlyBool);


		// SMS receiving phone number
		$("#SMSReceiverField").val(userData.phoneNumber);
	}
}


//********************************************************************
//			Clears all the content in the user details table
//********************************************************************
function clearUserDetailsTable() {
	$("#activeUserFullName").html("");
	$("#headerTitleDetailPage").html("");
	
	$("#cellUserID").html("");
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