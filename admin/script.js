var token; // The JWT used for communicating with the API
var expertUserData;
var seniorUserData;
var activeExpertUser;

         
// Sets the default jQuery mobile page transition
$(document).bind("mobileinit", function(){
	$.mobile.defaultPageTransition = "slidefade";
});


$(document).ready(function() {
	// Checks if the token and user data exist in localStorage
	if (localStorage.token && localStorage.userid && localStorage.userid === "0") {
		token = localStorage.token; // Fetches token from localStorage
	} else {
		// Redirect to login page
		window.location.replace("../index.html");
	}

	showLoader();

	$.when($.ajax({
		/***************************
		** Get basic data and connected senior users of all expert users
		***************************/
		url: "../api/expertUsers.php",
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) { // If the API request fails
			console.log("Error attempting to call API: GET request to expertUserData.php");
		}, 
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				expertUserData = data.data;
				for (var i=0; i<expertUserData.length; i++) {
					if (expertUserData[i].seniorUsers === null) {
						expertUserData[i].seniorUsers = [];
					}
				}
			} else {
				console.log(data.status_message);
			}
		}
	}), $.ajax({
		/***************************
		** Get basic data about all senior users
		***************************/
		url: "../api/seniorUserData.php",
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) { // If the API request fails
			console.log("Error attempting to call API: GET request to seniorUserOverview.php");
		}, 
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				seniorUserData = data.data;
			} else {
				console.log(data.status_message);
			}
		}
	})).then(function(data, textStatus, jqXHR) {
		populateExpertUsersList();
		hideLoader();
	});


	initEventListeners();
});


function initEventListeners() {
	// Selects all senior users
	$("#selectAllSeniorUsers").click(function() { 
		$("INPUT[name='seniorUserID[]']").prop('checked', true).checkboxradio('refresh');
		return false;
	});

	// Selects no senior users
	$("#selectNoSeniorUsers").click(function() {
		$("INPUT[name='seniorUserID[]']").prop('checked', false).checkboxradio('refresh');
		return false;
	});

	$("#editExpertSeniorLinksForm").submit(function(e){
		showLoader(); // Shows the loading widget
		var formData = $("#editExpertSeniorLinksForm").serialize(); // Serialize the form data
		formData = formData.replace(/%5B%5D/g, "[]");
		formData += "&expertUserID=" + activeExpertUser.userID;

		$.ajax({
			type: "POST",
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			url: "../api/expertSeniorLink.php",
			data: formData,
			success: function(data, status) { // If the API request is successful
				if (data.data) {
					showToast("#toastEditExpertSeniorLinks", true, data.status_message, 3000); // Shows toast with success msg

					var params = formData.split("&");
					var userIDs = [];
					for (var i=0; i<params.length; i++) {
						if (params[i].includes("seniorUserID[]=")) {
							var paramParts = params[i].split("=");
							userIDs.push(parseInt(paramParts[1]));
						}
					}
					activeExpertUser.seniorUsers = userIDs;
				} else {
					showToast("#toastEditExpertSeniorLinks", false, data.status_message, 3000); // Shows toast with error msg
				}
				hideLoader(); // Hides the loading widget
			},
			error: function(data, status) {
				showToast("#toastEditExpertSeniorLinks", false, data.status_message, 3000); // Shows toast with error msg
				hideLoader(); // Hides the loading widget
			}
		});

		return false; // Returns false to stop the default form behaviour
	});


	$("#newExpertUserForm").submit(function(e){
		showLoader(); // Shows the loading widget
		var usernameUnique = false;

		$.when($.ajax({
			type: "GET",
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			url: "../api/checkUsernameAvailability.php?username=" + $("#inputFieldNewUsername").val(),
			success: function(data, status) { // If the API request is successful
				
				if (data.data) {
					usernameUnique = (data.data === -1); // -1 is returned if no match found for the given username was found
				} else {
					showToast("#toastNewExpertUser", false, "Det ble ikke opprettet forbindelse med databasen", 3000); // Shows toast with error msg
				}
			},
			error: function(data, status) {
				hideLoader(); // Hides the loading widget
				console.log("Error writing new user to database. " + data);
				showToast("#toastNewExpertUser", false, "Det oppstod en feil", 3000); // Shows toast with error msg
			}
		})).then(function(data, textStatus, jqXHR) {

			if (usernameUnique) {
				var formData = $("#newExpertUserForm").serialize(); // Serialize the form data

				$.ajax({
					type: "POST",
					beforeSend: function (request) {
						request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
					},
					url: "../api/expertUsers.php",
					data: formData,
					success: function(data, status) { // If the API request is successful
						if (data.data) {
							showToast("#toastNewExpertUser", true, data.status_message, 3000); // Shows toast with success msg

							var newUser = data.data;
							newUser.seniorUsers = [];
							if (expertUserData === null || expertUserData === undefined) {
								expertUserData = [];
							}
							expertUserData.push(newUser);
							populateExpertUsersList();
						} else {
							showToast("#toastNewExpertUser", false, data.status_message, 3000); // Shows toast with error msg
						}
						hideLoader(); // Hides the loading widget
					},
					error: function(data, status) {
						showToast("#toastNewExpertUser", false, data.status_message, 3000); // Shows toast with error msg
						hideLoader(); // Hides the loading widget
					}
				});
			} else {
				showToast("#toastNewUserForm", false, "Det oppgitte brukernavnet er allerede i bruk.", 3000); // Shows toast with error msg
				hideLoader(); // Hides the loading widget
			}
		});

		return false; // Returns false to stop the default form behaviour
	});
}


//********************************************************************
//  	Writes expert user data to the expertUsersList in DOM 
//********************************************************************
function populateExpertUsersList() {
	if (expertUserData) {
		var html = "";
		for (var i=0; i<expertUserData.length; i++) { // Iterates the user data to build a table row for each entry
			html += "<li><a href='#' onclick='setActiveExpertUser(" + i + ")'>" + expertUserData[i].firstName + " " + expertUserData[i].lastName + "</a></li>";
		}
		
		$("#expertUsersList").html(html);
		$("#expertUsersList").listview("refresh");
	}
}


function setActiveExpertUser(idx) {
	activeExpertUser = expertUserData[idx];
	$("#expertFullName").html(expertUserData[idx].firstName + " " + expertUserData[idx].lastName);

	var html = "";
	if (seniorUserData) {
		for (var i=0; i<seniorUserData.length; i++) {
			seniorUser = seniorUserData[i];
			html += "<input type='checkbox' name='seniorUserID[]' id='SeniorUserCheckbox-" + i + "' value='" + seniorUser.userID + "'";

			for (var j=0; j<activeExpertUser.seniorUsers.length; j++) {
				if (seniorUser.userID === activeExpertUser.seniorUsers[j]) {
					html += " checked";
					break;
				}
			}

			html += "><label for='SeniorUserCheckbox-" + i + "'>" + seniorUser.firstName + " " + seniorUser.lastName + " (ID=" + seniorUser.userID + ")</label>"
		}
	}
	
	if (seniorUserData) {
		$("#seniorUsersCheckboxes").html(html);
		$("#seniorUsersCheckboxGroup").trigger('create');
	} else {
		$("#editExpertSeniorLinksForm").hide();
		$("#errorMsgContainer").html("Ingen seniorbrukere er registrert ennå. Logg inn som en ekspertbruker for å opprette seniorbrukere.");

	}

	$.mobile.changePage("index.html#user-detail-page");
}