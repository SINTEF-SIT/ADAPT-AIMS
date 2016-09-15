//********************************************************************
//                         Global variables
//********************************************************************

var activeUser = null; // Stores data about the currently selected senior user
var seniorUsers = null; // Stores all relevant information about the senior users the expert user has access to

// Data about the logged in expert user
var expertUserID;
var expertFirstName;
var expertLastName;
var expertUsername;
var token; // The JWT used for communicating with the API

var exerciseGroups; // Exercise groups and their exercises that can be recommended to the senior users
var feedbackDefault; // The default AI and BI feedback messages, with links to exercises
var feedbackDefaultAll; // feedbackDefault + older messages
var settings; // General settings and text strings used in the system

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
//    Runs when the DOM is ready for JavaScript code to execute. 
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

	// Fetches data about the senior users that the expert user has access to from db, along with other relevant data. 
	getData();


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

	initEventListenersDocumentReady(); // Function containing all DOM event listeners. Placed in separate file eventListeners.js
});


//********************************************************************
//        Generates the options elements used in a select box
//          to select an exercise to link to a feedback msg. 
//   The indexSection parameter indicates if the exercises should
//            be connected to low, medium or high BI value.
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
// Stores which senior user is currently active, and writes to the DOM   
//********************************************************************
function setActiveUser(userID, changePage) {

	// Don't update DOM if the DOM already contains the data for the requested user
	if (changePage && activeUser !== null && activeUser.userData.userID == userID) {
		$.mobile.changePage("index.html#user-detail-page");
		return;
	}

	activeUser = null;

	balanceChart = null;
	activityChart = null;
	balanceChartOptions = null;
	activityChartOptions = null;

	// Hides the charts until they are populated with data
	$("#balanceChartContainer").hide();
	$("#activityChartContainer").hide();


	// Displays the initial character count for SMS sending
	countSMSChar(document.getElementById("bulkSMSContentField"), "charCounterBulkSMS");
	countSMSChar(document.getElementById("singleSMSContentField"), "charCounterSingleSMS");

	clearUserDetailsTable(); // Removes existing content (if any) from the user details table

	// Removes all content (if any) from the personalized feedback tables
	$('#tablePersonalizedBIFeedbackMsgs tbody tr').remove();
	$('#tablePersonalizedAIFeedbackMsgsSitting tbody tr').remove();
	$('#tablePersonalizedAIFeedbackMsgsWalking tbody tr').remove();

	// Hides the containers of the feedback messages (will be shown again if the feedback group is found in DB)
	$('#personalizedBIFeedbackMsgsContainer').hide();
	$('#personalizedAIFeedbackMsgsSittingContainer').hide();
	$('#personalizedAIFeedbackMsgsWalkingContainer').hide();

	if (changePage) { // If the function is called from the main page: redirect to the user detail page
		$.mobile.changePage("index.html#user-detail-page");
	}


	activeUser = getSeniorUser(userID); // Stores the data about the selected user in the activeUser variable


	// Sets default values for datepickers on register data page
	$("#balanceIdxToDatePicker").val(moment().format('YYYY-MM-DD')); // Sets current date
	$("#activityIdxToDatePicker").val(moment().format('YYYY-MM-DD')); // Sets current date

	if (activeUser.balanceIndexes !== null) {
		$('#balanceIdxFromDatePicker').attr('readonly', 'readonly');
		$('#balanceIdxFromDatePicker').val(activeUser.balanceIndexes[activeUser.balanceIndexes.length-1].dateTo);
	} else {
		$('#balanceIdxFromDatePicker').val(moment().subtract(7, 'days').format('YYYY-MM-DD')); // 7 days ago
	}
	if (activeUser.activityIndexes !== null) {
		$('#activityIdxFromDatePicker').attr('readonly', 'readonly');
		$('#activityIdxFromDatePicker').val(activeUser.activityIndexes[activeUser.activityIndexes.length-1].dateTo);

	} else {
		$('#balanceIdxFromDatePicker').val(moment().subtract(7, 'days').format('YYYY-MM-DD')); // 7 days ago
	}
	
	// Adds change listeners to the flip switches. Functions are found in eventListeners.js
	$("#flipPersonalizedBI").on("change", BIFlipChanged);
	$("#flipPersonalizedAISitting").on("change", AISittingFlipChanged);
	$("#flipPersonalizedAIWalking").on("change", AIWalkingFlipChanged);

	populateCustomFeedbackTables(); // Populated custom feedback tables in DOM

	if (activeUser.activityIndexes === null || activeUser.balanceIndexes === null) {
		drawBIChart(null, null);
		drawAIChart(null, null);
	} else {
		// Set equal x-axis interval for both charts
		var maxChartInterval = 1000 * 60 * 60 * 24 * settings.maxXAxisIntervalDays;

		var AIFirst = moment.tz(activeUser.activityIndexes[0].dateFrom, "UTC").valueOf();
		var BIFirst = moment.tz(activeUser.balanceIndexes[0].dateFrom, "UTC").valueOf();
		var AILast = moment.tz(activeUser.activityIndexes[activeUser.activityIndexes.length-1].dateTo, "UTC").valueOf();
		var BILast = moment.tz(activeUser.balanceIndexes[activeUser.balanceIndexes.length-1].dateTo, "UTC").valueOf();

		var chartsEndTime = (AILast > BILast) ? AILast : BILast;

		var AISpan = chartsEndTime - AIFirst;
		var BISpan = chartsEndTime - BIFirst;

		var chartsInterval = (AISpan > BISpan) ? AISpan : BISpan; // Find the longest interval of the two charts
		// If the chart data interval is longer than the max interval, use the max interval
		var chartsStartTime = (chartsInterval > maxChartInterval) ? chartsEndTime-maxChartInterval : chartsEndTime-chartsInterval;

		// Draw the charts
		drawBIChart(chartsStartTime, chartsEndTime);
		drawAIChart(chartsStartTime, chartsEndTime);
	}

	if (activeUser.balanceIndexes) {
		// Calculates whether the current BI value for this user is classified as low, medium or high
		var BISection = -1;
		if (activeUser.userData.balanceIdx >= settings.BIThresholdLower && activeUser.userData.balanceIdx < settings.BIThresholdUpper) {
			BISection = 0;
		} else if (activeUser.userData.balanceIdx > settings.BIThresholdUpper) {
			BISection = 1;
		}

		// Populate the dropdown for selecting linked exercise to new personalized BI feedback msgs
		$("#selectPersonalizedBIFeedbackBalanceExercise").html(generateExerciseDropdownOptionHTML(BISection, -1, 0));
		$("#selectPersonalizedBIFeedbackStrengthExercise").html(generateExerciseDropdownOptionHTML(BISection, -1, 1));
	}

	updateDOM(); // Populates the user detail and edit user data pages with data from activeUser
}

/*
//********************************************************************
//  Called from the confirm dialog for overwriting existing BI value
//********************************************************************
function updateBI(doUpdate) {
	if (doUpdate) writeNewBI(tempBIFormData, true);
	tempBIFormData = null;
}

//********************************************************************
//  Called from the confirm dialog for overwriting existing AI value
//********************************************************************
function updateAI(doUpdate) {
	if (doUpdate) writeNewAI(tempAIFormData, true);
	tempAIFormData = null;
}
*/

//********************************************************************
//				Stores BI, AI (sitting) and AI (walking) 
//				   custom feedback messages separately
//********************************************************************
function separateCustomFeedbackTypes() {
	var feedbackCustomBI = [];
	var feedbackCustomAISitting = [];
	var feedbackCustomAIWalking = [];

	for (var i=0; i<seniorUsers.length; i++) {
		if (seniorUsers[i].feedbackCustom) {
			for (var j=0; j<seniorUsers[i].feedbackCustom.length; j++) {
				if (seniorUsers[i].feedbackCustom[j].category === 1) { // BI feedback
					feedbackCustomBI.push(seniorUsers[i].feedbackCustom[j]);
				} else if (seniorUsers[i].feedbackCustom[j].AIFeedbackType === 0) { // AI (sitting) feedback
					feedbackCustomAISitting.push(seniorUsers[i].feedbackCustom[j]);
				} else { // AI (walking) feedback
					feedbackCustomAIWalking.push(seniorUsers[i].feedbackCustom[j]);
				}
			}
			seniorUsers[i].feedbackCustomBI = feedbackCustomBI;
			seniorUsers[i].feedbackCustomAISitting = feedbackCustomAISitting;
			seniorUsers[i].feedbackCustomAIWalking = feedbackCustomAIWalking;
		} else {
			seniorUsers[i].feedbackCustomBI = null;
			seniorUsers[i].feedbackCustomAISitting = null;
			seniorUsers[i].feedbackCustomAIWalking = null;
		}
		feedbackCustomBI = [];
		feedbackCustomAISitting = [];
		feedbackCustomAIWalking = [];
	}
}


//********************************************************************
//		Fetches the title of an exercise given a certain ID
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
//				 Parses a date string to a date object
//********************************************************************
function parseDate(input) {
  var parts = input.split('-');
  return new Date(parts[0], parts[1]-1, parts[2]);
}


//********************************************************************
//	  Calculates the age of a user in years based on date of birth
//********************************************************************
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


//********************************************************************
//		  Updates the values in the row in the user overview
//				table corresponding to the active user
//********************************************************************
function updateUsersTableRow() {
	if (activeUser) {

		var usersTableRow = findUsersTableRow(activeUser.userData.userID);

		if (usersTableRow !== null) {
			usersTableRow[0].cells[0].childNodes[0].innerText = activeUser.userData.lastName;
			usersTableRow[0].cells[1].childNodes[0].innerText = activeUser.userData.firstName;
			usersTableRow[0].cells[2].childNodes[0].innerText = calculateAge(activeUser.userData.birthDate);
			usersTableRow[0].cells[3].childNodes[0].innerText = activeUser.userData.balanceIdx;
			usersTableRow[0].cells[4].childNodes[0].innerText = activeUser.userData.activityIdx;
		}
	}
}


//********************************************************************
//  Counts the number of characters of a given text, and calculates
// how many SMSes will need to be sent to transfer the whole message,
//	and how many characters ramain until a new SMS message will need
//********************************************************************
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


//********************************************************************
// Checks if a given number is a valid Norwegian mobile phone number
//********************************************************************
function validMobilePhoneNumber(phoneNumber) {
	return ((phoneNumber >= 40000000 && phoneNumber <= 49999999) ||
		phoneNumber >= 90000000 && phoneNumber <= 99999999)
}


//********************************************************************
//		Searches the DOM for a specific row in the users table
//********************************************************************
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


//********************************************************************
//				Finds a senior user from the userID
//********************************************************************
function getSeniorUser(userID) {
	for (var i=0; i<seniorUsers.length; i++) {
		if (seniorUsers[i].userData.userID === userID) {
			return seniorUsers[i];
		}
	}
	return null;
}