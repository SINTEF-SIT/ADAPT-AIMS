var token; // The JWT used for communicating with the API
var expertUserData;
var seniorUserData;

$(document).ready(function() {
	// Checks if the token and user data exist in localStorage
	if (localStorage.token && localStorage.userid && localStorage.userid == 0) {
		token = localStorage.token; // Fetches token from localStorage
	} else {
		// Redirect to login page
		window.location.replace("../index.html");
	}

	$.when($.ajax({
		/***************************
		** Get basic data and connected senior users of all expert users
		***************************/
		url: "../api/expertUserOverview.php",
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
			} else {
				console.log(data.status_message);
			}
		}
	}), $.ajax({
		/***************************
		** Get basic data about all senior users
		***************************/
		url: "../api/seniorUserOverview.php",
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
		if (seniorUserData && expertUserData) {
			for (var i=0; i<expertUserData.length; i++) {
				console.log(expertUserData[i].firstName + " " + expertUserData[i].lastName + " har følgende seniorbrukere: ");
				for (var j=0; j<expertUserData[i].seniorUsers.length; j++) {
					var seniorUserID = expertUserData[i].seniorUsers[j];
					for (var k=0; k<seniorUserData.length; k++) {
						if (seniorUserData[k].userID == seniorUserID) {
							console.log(seniorUserData[k].firstName + " " + seniorUserData[k].lastName);
						}
					}
				}
			}
		}
	});
});