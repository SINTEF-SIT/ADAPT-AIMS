//********************************************************************
//************************ Global variables **************************
//********************************************************************

$activeUserData = null; // Stores data about the currently selected senior user
var CSVFileAI = null; // Stores a CSV file for AI values when uploaded
var CSVFileBI = null; // Stores a CSV file for BI values when uploaded

// Data about the logged in expert user
var expertUserID;
var expertFirstName;
var expertLastName;
var expertEmail;
var token; // The JWT used for communicating with the API

// If expert user tries to submit a new MI with a date that already has an MI
// for this senior user, a prompt appears asking to confirm overwrite. The form
// data is stored here temporarily.
var tempMIFormData = null;

// Stores the charts displayed on the user detail page
var mobilityChart = null;
var balanceChart = null;
var activityChart = null;



//********************************************************************
//******** Returns the current date to be used as the default ********
//*********** value in the datepicker in the new MI form *************
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
    if ($activeUserData != null) {
    	if (mobilityChart != null) mobilityChart.reflow();
	    if (balanceChart != null) balanceChart.reflow();
	    if (activityChart != null) activityChart.reflow();
    }
});



//********************************************************************
//*** Runs when the DOM is ready for JavaScript code to execute. *****
//********************************************************************
$(document).ready(function() {
	// Checks if the token and user data exist in localStorage
	if (localStorage.token && localStorage.userid && localStorage.firstname && localStorage.lastname && localStorage.email) {
		// Fetches token and data about the logged in user from localStorage
		token = localStorage.token;
		expertUserID = localStorage.userid;
		expertFirstName = localStorage.firstname;
		expertLastName = localStorage.lastname;
		expertEmail = localStorage.email;
	} else {
		// Redirect to login page
		window.location.replace("../index.html");
	}

	// Writes the current date to the datepicker in the new MI form
	$('#mobilityIdxDatePicker').val(new Date().toDateInputValue());

	// Fetches data about the senior users that the expert user has access to from db. 
	getUserOverview();

	// Checks if the browser supports file upload
	if (isFileAPIAvailable()) {
		// Binds function to be called when a file is uploaded
		$('#csvFileInputAI').bind('change', handleAIFileSelect);
		$('#csvFileInputBI').bind('change', handleBIFileSelect);
	}

	

	//********************************************************************
	//*********** Submit form for storing new mobility index *************
	//********************************************************************
	$("#mobilityIdxForm").submit(function(e){
		// Fetch the MI form value from the DOM
		$mobilityIdxValue = $('#mobilityIdxInputField').val();

		// Checks that the MI value is not equal to the current MI
		if (parseFloat($mobilityIdxValue) != parseFloat($activeUserData["mobilityIdx"])) {
			// Checks that the MI is numeric and within the boundaries
			if ($.isNumeric($mobilityIdxValue) && $mobilityIdxValue >= 0 && $mobilityIdxValue <= 1) {
				
				// Serialize the form data and append the senior user ID
				formData = $("#mobilityIdxForm").serialize();
				formData += "&userID=" + $activeUserData.userID;

				// Check if an MI value is already registered for the given date
				var match = null;
				for (var i=0; i<$activeUserData.mobilityIdxs.length; i++) {
					if ($activeUserData.mobilityIdxs[i].timeDataCollected == $("#mobilityIdxDatePicker").val()) {
						match = $activeUserData.mobilityIdxs[i];
					}
				}

				if (match == null) {
					// No conflicting dates. Form data is sent to DB.
					writeNewMI(formData, false);
				} else {
					// A match was found for the submitted date in the DB.
					// Page for confirming overwrite is prepared and displayed.
					formData += "&mobilityIndexID=" + match.mobilityIndexID;
					tempMIFormData = formData;
					$("#overwriteMIDialogOldValue").html(match.value);
					$("#overwriteMIDialogDate").html(match.timeDataCollected);
					$("#overwriteMIDialogNewValue").html($mobilityIdxValue);
					
					$.mobile.changePage( "index.html#confirm-overwrite-mi-dialog", { transition: "pop" });
				}
			} else {
				// Invalid MI
				showToast("#toastMobilityIdxForm", false, "Feil: ugyldig mobility index");
			}
		} else {
			// Supplied MI is equal to the current MI
			showToast("#toastMobilityIdxForm", false, "Feil: Oppgitt mobility index er den samme som nåværende index.");
		}

		// Empty the MI input field
		$('#mobilityIdxInputField').val("");

		return false; // Returns false to stop the default form behaviour
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
		
		$.ajax({
			type: "POST",
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
	        },
			url: "http://vavit.no/adapt-staging/api/postBalanceIdx.php",
			data: formData,
			success: function(data, status) { // If the API request is successful
				setActiveUser($activeUserData.userID, false); // Sets the active user, which in turn updates the active user data and charts
				showToast("#toastBalanceIdxManualForm", true, data.status_message); // Shows toast with success msg
			},
			error: function(data, status) { // If the API request fails
				hideLoader(); // Hides the loading widget
				showToast("#toastBalanceIdxManualForm", false, data.status_message); // Shows toast with error msg
			}
		});

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
		$.ajax({
			type: "POST",
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
	        },
			url: "http://vavit.no/adapt-staging/api/postActivityIdx.php",
			data: formData,
			success: function(data, status) { // If the API request is successful
				setActiveUser($activeUserData.userID, false); // Sets the active user, which in turn updates the active user data and charts
				showToast("#toastActivityIdxManualForm", true, data.status_message); // Shows toast with success msg
			},
			error: function(data, status) {
				hideLoader(); // Hides the loading widget
				showToast("#toastActivityIdxManualForm", false, data.status_message); // Shows toast with error msg
			}
		});
		
		// Empties the form
		$('#activityIdxDatePicker').val("");
		$('#activityIdxInputField').val("");
		$('#activityIdxInputField').focus();

		return false; // Returns false to stop the default form behaviour
	});


	//********************************************************************
	//****** Submit form for storing new custom feedback message *********
	//********************************************************************
	/*$("#registerFeedbackForm").submit(function(e){
		showLoader(); // Shows the loading widget

		// Fetch the submitted feedback message from the DOM
		$feedbackText = $('#textarea-feedback').val();

		if ($feedbackText != null && $feedbackText != "") {
			// Serialize the form data and append the senior user ID
			formData = $("#registerFeedbackForm").serialize();
			formData += "&userID=" + $activeUserData.userID;
			$.ajax({
				type: "POST",
				beforeSend: function (request) {
		            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		        },
				url: "http://vavit.no/adapt-staging/api/postFeedbackMsgCustom.php",
				data: formData,
				success: function(data, status) { // If the API request is successful
					hideLoader(); // Hides the loading widget
					showToast("#toastFeedbackForm", true, data.status_message); // Shows toast with success msg
				},
				error: function(data, status) {
					hideLoader(); // Hides the loading widget
					showToast("#toastFeedbackForm", false, data.status_message); // Shows toast with error msg
				}
			});
		} else {
			showToast("#toastFeedbackForm", false, "Feil: Du må skrive inn en tekst.");
		}

		$('#textarea-feedback').val("");

		return false; // Returns false to stop the default form behaviour
	});*/
	


	//********************************************************************
	//***** Submit form for storing new custom AI feedback message *******
	//********************************************************************
	$("#registerAIFeedbackForm").submit(function(e){
		showLoader(); // Shows the loading widget
		formData = $("#registerAIFeedbackForm").serialize(); // Serialize the form data
		
		submitFeedbackMsg(formData, "#toastAIFeedbackForm"); // Calls the API to store the new feedback msg
		
		$('#textarea-ai-feedback').val(""); // Empties the feedback input field
		return false; // Returns false to stop the default form behaviour
	});
	


	//********************************************************************
	//***** Submit form for storing new custom BI feedback message *******
	//********************************************************************
	$("#registerBIFeedbackForm").submit(function(e){
		showLoader(); // Shows the loading widget
		formData = $("#registerBIFeedbackForm").serialize();// Serialize the form data
		
		submitFeedbackMsg(formData, "#toastBIFeedbackForm"); // Calls the API to store the new feedback msg
		
		$('#textarea-bi-feedback').val(""); // Empties the feedback input field
		return false; // Returns false to stop the default form behaviour
	});



	//********************************************************************
	//*************** Submit form for updating user data *****************
	//********************************************************************
	$("#editUserDataForm").submit(function(e){
		showLoader(); // Shows the loading widget
		
		// Serialize the form data and append the senior user ID
		formData = $("#editUserDataForm").serialize();
		formData += "&userID=" + $activeUserData.userID;
		
		$.ajax({
			type: "POST",
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
	        },
			url: "http://vavit.no/adapt-staging/api/putUserData.php",
			data: formData,
			success: function(data, status) { // If the API request is successful
				if (data.data) {
					showToast("#toastEditUserDataForm", true, data.status_message); // Shows toast with success msg
				} else {
					showToast("#toastEditUserDataForm", false, data.status_message); // Shows toast with error msg
				}

				setActiveUser($activeUserData.userID, false); // Sets the active user, which in turn updates the DOM with new user data
				getUserOverview(); // Updates the main page DOM with new data from db
			},
			error: function(data, status) {
				hideLoader(); // Hides the loading widget
				showToast("#toastEditUserDataForm", false, data.status_message); // Shows toast with error msg
			}
		});

		return false; // Returns false to stop the default form behaviour
	});


	//********************************************************************
	//************* Submit form for adding new senior user ***************
	//********************************************************************
	$("#newUserForm").submit(function(e){
		showLoader(); // Shows the loading widget
		
		// Serialize the form data and append the senior user ID
		formData = $("#newUserForm").serialize();
		formData += ("&expertUserID=" + expertUserID);

		$.ajax({
			type: "POST",
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
	        },
			url: "http://vavit.no/adapt-staging/api/postSeniorUser.php",
			data: formData,
			success: function(data, status) { // If the API request is successful
				hideLoader(); // Hides the loading widget
				$.mobile.back();
				getUserOverview(); // Updates the DOM with new data from db
				clearNewUserForm();
			},
			error: function(data, status) {
				hideLoader(); // Hides the loading widget
				showToast("#toastNewUserForm", false, data.status_message); // Shows toast with error msg
			}
		});

		// Returns false to stop the default form behaviour
		return false;
	});
});



//********************************************************************
//**** Fetches data about the senior users that the expert user ******
//******************* has access to from the DB. *********************
//********************************************************************
function getUserOverview() {
	showLoader(); // Shows the loading widget
	$.ajax({
		url: "http://vavit.no/adapt-staging/api/getSeniorUserOverview.php?expertUserID=" + expertUserID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		error : function(data, status) {
			hideLoader(); // Hides the loading widget
			console.log("Error fetching data from API getSeniorUserOverview.");
		},
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			var userData = data.data;

			if (userData != null) { // Checks that the API call returned data
				$('#usersTable tbody tr').remove(); // Removes all rows from the usersTable body (if any)
				
				var html = '';
				for (var i=0; i<userData.length; i++) { // Iterates the user data to build a table row for each entry
					//If MI is null, replace it with empty string
					$mobilityIdx = userData[i].mobilityIdx;
					if ($mobilityIdx == null) {
						$mobilityIdx = "";
					}

					$age = calculateAge(userData[i].birthDate); // Calculate the age of the senior user in years

					html += "<tr>"
					+ "<td class='ui-table-priority-4'><a onclick='setActiveUser(" + userData[i].userID + ",true);'>" + userData[i].userID + "</a></td>"
					+ "<td><a onclick='setActiveUser(" + userData[i].userID + ",true);'>" + userData[i].lastName + "</a></td>"
					+ "<td class='ui-table-priority-1'><a onclick='setActiveUser(" + userData[i].userID + ",true);'>" + userData[i].firstName + "</a></td>"
					+ "<td class='ui-table-priority-3'><a onclick='setActiveUser(" + userData[i].userID + ",true);'>" + $age + "</a></td>"
					+ "<td class='ui-table-priority-2'><a onclick='setActiveUser(" + userData[i].userID + ",true);'>" + $mobilityIdx + "</a></td>"
					+ "</tr>";
				}
				$('#usersTable tbody').append(html);
			} else {
				console.log("No user data returned from API.");
			}
		}
	});
}



//********************************************************************
//****** Fetches the most recent MI for the given senior user ********
//********************************************************************
/*function getNewestMobilityIdx(userID) {
	showLoader(); // Shows the loading widget
	$.ajax({
		url: "http://vavit.no/adapt-staging/api/getNewestMobilityIdx.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		error : function(data, status) {
			hideLoader(); // Hides the loading widget
			console.log("Error fetching data from API getNewestMobilityIdx.");
			return null;
		},
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			if (data.data) {
				return data.data.value;
				console.log("successfully fetched MI for userID=" + userID + ". Data=" + data.data.value);
			} else {
				return null;
			}
		}
	});
}*/



//********************************************************************
//** Feches data about a specific senior user and writes to the DOM **
//********************************************************************
function setActiveUser(userID, changePage) {
	showLoader(); // Shows the loading widget

	mobilityChart = null;
    balanceChart = null;
    activityChart = null;

	clearUserDetailsTable(); // Removes existing content (if any) from the user details table
	clearEditUserForm(); // Removes existing content (if any) from the edit user form

	$('#tableAIFeedbackMsgs tbody tr').remove(); // Removes all content (if any) from them AI feedback table
	$('#tableBIFeedbackMsgs tbody tr').remove(); // Removes all content (if any) from them BI feedback table
	$('#AIFeedbackMsgsContainer').hide(); // Hides the container of the AI feedback (will be shown again if AI feedback is found in DB)
	$('#BIFeedbackMsgsContainer').hide(); // Hides the container of the BI feedback (will be shown again if BI feedback is found in DB)

	if (changePage) { // If the function is called from the main page: redirect to the user detail page
		$.mobile.changePage("index.html#user-detail-page");
	}

	$.when($.ajax({
		//********************************************************************
		//**************** Get details about the senior user *****************
		//********************************************************************
		url: "http://vavit.no/adapt-staging/api/getSeniorUserDetails.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		error : function(data, status) {
			console.log("Error getting the user details. Msg from API: " + status);
		}, 
		success: function(data, status) { // If the API request is successful
			$activeUserData = data.data[0];
			updateDOM(); // Populates the user detail and edit user data pages with data from $activeUserData
			getFeedbackMsgs(userID); // Fetches feedback messages for the senior user from DB
		}
	}), $.ajax({
		//********************************************************************
		//********** Get mobility indexes to populate the MI chart ***********
		//********************************************************************
		url: "http://vavit.no/adapt-staging/api/getMobilityIdxs.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		error : function(data, status) {
			console.log("Error attempting to call API getMobilityIdxs.php with parameter seniorUserID=" + userID);
			hideLoader(); // Hides the loading widget
		}, 
		success: function(data, status) { // If the API request is successful
			var chartDataJSON = data.data;
			if ($activeUserData == null) $activeUserData = {}; // Create empty object if $activeUserData has not been created yet
			$activeUserData["mobilityIdxs"] = chartDataJSON; // Store the MI values in $activeUserData

	        if (data.data != null) { // Check if API returned any MI values
		    	var chartData = [];
		        for (var i=0; i<chartDataJSON.length; i++) {
		            if (i != 0) {
		            	// Draws an extra data point right before each data point (except the first) 
						// to get a flat line instead of a straight, diagonal line between the points.
						// Needs to be commented out if the chart is switched to a column chart.
		                var dataPointPre = [];
		                var datePre = new Date(chartDataJSON[i].timeDataCollected);
		                datePre.setSeconds(datePre.getSeconds() - 1);
		                dataPointPre.push(datePre.getTime());
		                dataPointPre.push(parseFloat(chartDataJSON[i-1].value));
		                chartData.push(dataPointPre);
		            }

		            var dataPoint = [];
		            var date = Date.parse(chartDataJSON[i].timeDataCollected);
		            dataPoint.push(date);
		            dataPoint.push(parseFloat(chartDataJSON[i].value));
		            chartData.push(dataPoint);

		            // If last data point from db, add a final data point at the current datetime
		            if (i+1 == chartDataJSON.length) {
		                var dataPointFinal = [];
		                dataPointFinal.push(new Date().getTime());
		                dataPointFinal.push(parseFloat(chartDataJSON[i].value));
		                chartData.push(dataPointFinal);
		            }
		        }

		        chartOptions = {
			        chart: {
			            renderTo: 'mobilityChart', // ID of div where the chart is to be rendered
			            type: 'area', // Chart type. Can e.g. be set to 'column' or 'area'
			            zoomType: 'x', // The chart is zoomable along the x-axis by clicking and draging over a portion of the chart
			            backgroundColor: null,
			            reflow: true
			        },
			        title: {
			            text: 'Mobility index'
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
			            min: 0, // The floor of the y-axis
			            alternateGridColor: '#DEE0E3',
			            tickInterval: 0.1 // How frequent a tick is displayed on the axis
			        },
			        legend: {
			            enabled: false // Hides the legend showing the name and toggle option for the series
			        },
			        credits: {
			            enabled: false // Hides the Highcharts credits
			        },
			        series: [{}]
			    };

			    // Sets global options for the charts
				Highcharts.setOptions({
			        // Defines Norwegian text strings used in the charts
			        lang: {
			        	months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni',  'juli', 'august', 'september', 'oktober', 'november', 'desember'],
			            shortMonths: ['jan', 'feb', 'mars', 'apr', 'mai', 'juni',  'juli', 'aug', 'sep', 'okt', 'nov', 'des'],
			            weekdays: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
			            shortWeekdays: ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø']
			        }/*,
			        // Adjusts time values in data points to match Norwegian timezone (handles DST automatically).
					// Commented out as all the charts currently display date values only, not time of day,
					// and this code caused all values to be displayed at 2am instead of midnight.
			        global: {
			            getTimezoneOffset: function (timestamp) {
			                var zone = 'Europe/Oslo',
			                    timezoneOffset = -moment.tz(timestamp, zone).utcOffset();

			                return timezoneOffset;
			            }
			        }*/
			    });

		        chartOptions.series[0].data = chartData;

		        mobilityChart = new Highcharts.Chart(chartOptions);
		        $("#mobilityChartContainer").show(); // Shows the MI chart in the DOM
	        } else {
	        	$("#mobilityChartContainer").hide(); // Hides the chart if no MI data is found
	        	console.log("No mobility idx values found in db.");
	        }
	        hideLoader(); // Hides the loading widget
		}
	}), $.ajax({
		//********************************************************************
		//********** Get balance indexes to populate the BI chart ************
		//********************************************************************
		url: "http://vavit.no/adapt-staging/api/getBalanceIdxs.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		error : function(data, status) {
			console.log("Error attempting to call API getBalanceIdxs.php with parameter seniorUserID=" + userID);
		}, 
		success: function(data, status) { // If the API request is successful
			var balanceChartDataJSON = data.data;
			var balanceChartData = [];

			if (balanceChartDataJSON != null) {
				var maxMI = 0;
				for (var i=0; i<balanceChartDataJSON.length; i++) {
					// Uncomment if chart is area chart!
					/*if (i != 0) {
						// Draws an extra data point right before each data point (except the first) 
						// to get a flat line instead of a straight, diagonal line between the points.
						// Needs to be commented out if the chart is switched to a column chart.
						var dataPointPre = [];
						var datePre = new Date(balanceChartDataJSON[i].timeDataCollected);
						datePre.setSeconds(datePre.getSeconds() - 1);
						dataPointPre.push(datePre.getTime());
						dataPointPre.push(parseFloat(balanceChartDataJSON[i-1].value));
						balanceChartData.push(dataPointPre);
					}*/

					var mi = parseFloat(balanceChartDataJSON[i].value);
					if (mi > maxMI) maxMI = mi;

					var dataPoint = [];
					var date = Date.parse(balanceChartDataJSON[i].timeDataCollected);
					dataPoint.push(date);
					dataPoint.push(mi);
					balanceChartData.push(dataPoint);

					// Uncomment if chart is area chart!
					// If last data point from db, add a final data point at the current datetime
					/*if (i+1 == balanceChartDataJSON.length) {
						var dataPointFinal = [];
						dataPointFinal.push(new Date().getTime());
						dataPointFinal.push(parseFloat(balanceChartDataJSON[i].value));
						balanceChartData.push(dataPointFinal);
					}*/
				}

				balanceChartOptions = {
					chart: {
						renderTo: 'balanceChart', // ID of div where the chart is to be rendered
						type: 'column', // Chart type. Can e.g. be set to 'column' or 'area'
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
						//max: 1, // The ceiling value of the y-axis
						min: 0, // The floor of the y-axis
			            endOnTick: false,
						alternateGridColor: '#DEE0E3',
						tickInterval: 0.1 // How frequent a tick is displayed on the axis
					},
					legend: {
			            enabled: false // Hides the legend showing the name and toggle option for the series
			        },
			        credits: {
			            enabled: false // Hides the Highcharts credits
			        },
					series: [{
						/*color: {
			                linearGradient: {
			                    x1: 0,
			                    y1: 0,
			                    x2: 0,
			                    y2: 1
			                },
			                stops: [
			                    [0, 'grey'],
			                    [0.5, 'grey'],
			                    [1, '#ED1E24']
			                ]
			            },
			            lineWidth: 0,
			            enableMouseTracking: false*/
					}]
				};

				/*colorMaxMI = getMIChartData($currentMobilityIdx).color; // todo: define correlation between BI and MI
				colorMidMI = getMIChartData($currentMobilityIdx/2).color;

				balanceChartOptions.series[0].color.stops[0][1] = "#" + colorMaxMI;
				balanceChartOptions.series[0].color.stops[1][1] = "#" + colorMidMI;*/

				balanceChartOptions.series[0].data = balanceChartData;

				balanceChart = new Highcharts.Chart(balanceChartOptions);
				$("#balanceChartContainer").show(); // Shows the MI chart in the DOM
			} else {
				$("#balanceChartContainer").hide(); // Hides the chart if no MI data is found
				//$("#balanceChart").html("<h3>Det er ikke registrert noen data om din balanse ennå.</h3>");
			}
		}
	})).then(function(data, textStatus, jqXHR) {
		$.ajax({
			//********************************************************************
			//********** Get activity indexes to populate the AI chart ***********
			//********************************************************************

			url: "http://vavit.no/adapt-staging/api/getActivityIdxs.php?seniorUserID=" + userID,
			type: 'GET',
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
	        },
			error : function(data, status) {
				$("#activityChartContainer").hide();
				console.log("Error attempting to call API getActivityIdxs.php with parameter seniorUserID=" + userID);
			}, 
			success: function(data, status) { // If the API request is successful
				var activityChartDataJSON = data.data;
				if (activityChartDataJSON != null) {
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
							tickInterval: 1 // How frequent a tick is displayed on the axis
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
					$("#activityChartContainer").show(); // Shows the MI chart in the DOM
				} else {
					$("#activityChartContainer").hide(); // Hides the chart if no MI data is found
					//$("#activityChart").html("<h3>Det er ikke registrert noen aktivitetsdata ennå.</h3>");
				}
			}
		});
	});
}



//********************************************************************
//*********** Call API with a submitted feedback message *************
//********************************************************************
function submitFeedbackMsg(formData, toastID) {
	// Append the senior user ID to the form data
	formData += "&userID=" + $activeUserData.userID;
	
	$.ajax({
		type: "POST",
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		url: "http://vavit.no/adapt-staging/api/postFeedbackMsgCustom.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			getFeedbackMsgs($activeUserData.userID); // Fetches feedback messages for the senior user from DB
			showToast(toastID, true, data.status_message); // Shows toast with success msg
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast(toastID, false, data.status_message); // Shows toast with error msg
		}
	});
}



//********************************************************************
//************** Called from the confirmation dialog *****************
//*************  about overwriting existing MI value. ****************
//********************************************************************
function updateMI(doUpdate) {
	if (doUpdate) writeNewMI(tempMIFormData, true);
	tempMIFormData = null;
}

//********************************************************************
//****************** Writes new/updates MI to DB *********************
//********************************************************************
function writeNewMI(formData, update) {
	showLoader(); // Shows the loading widget

	// Calls different API depending on whether the data is 
	// stored as a new entry, or updating an existing entry
	var urlPart = (update ? "put" : "post"); 
	
	$.ajax({
		type: "POST",
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		url: "http://vavit.no/adapt-staging/api/" + urlPart + "MobilityIdx.php",
		data: formData,
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			if (data.data) {
				showToast("#toastMobilityIdxForm", true, data.status_message); // Shows toast with success msg
			} else {
				showToast("#toastMobilityIdxForm", false, data.status_message); // Shows toast with error msg
			}

			$currentNewestMIDate = $activeUserData.mobilityIdxTimeDataCollected;
			$inputMIDate = $('#mobilityIdxDatePicker').val();

			if ($currentNewestMIDate == null || parseDate($inputMIDate) > parseDate($currentNewestMIDate)) {
				// Updates DOM if the date of the created MI is more recent than the newest MI value
				$("#cellMobilityIdx").html($mobilityIdxValue);
				$activeUserData['mobilityIdx'] = $mobilityIdxValue;
				$activeUserData['mobilityIdxTimeDataCollected'] = $inputMIDate;
			}
			
			getUserOverview(); // Updates the main page DOM with new data from db
			setActiveUser($activeUserData.userID, false); // Sets the active user, which in turn updates the active user data and charts
		},
		error: function(data, status) {
			hideLoader(); // Hides the loading widget
			showToast("#toastMobilityIdxForm", false, data.status_message); // Shows toast with error msg
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
		url: "http://vavit.no/adapt-staging/api/putSeniorUserInactive.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		error : function(data, status) {
			hideLoader(); // Hides the loading widget
			console.log("Error writing to db through API putSeniorUserInactive.php with parameter seniorUserID=" + userID);
		}, 
		success: function(data, status) { // If the API request is successful
			hideLoader(); // Hides the loading widget
			$('table tr').each(function(){ // Iterates the table to find the row matching the userID, and removes it
				if ($(this).find('td').eq(0).text() == userID){
					$(this).remove();
				}
			});

			getUserOverview(); // Updates the DOM with new data from db

			$.mobile.back(); // Returns to the main page
		}
	});
}



//********************************************************************
//****** Calls API to fetch feedback messages for a given user. ******
//********************************************************************
function getFeedbackMsgs(userID) {
	$.ajax({
		url: "http://vavit.no/adapt-staging/api/getFeedbackMsgs.php?userID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
        },
		error : function(data, status) {
			console.log("Error fetching data from API getFeedbackMsgs.");
		},
		success: function(data, status) { // If the API request is successful
			var feedbackData = data.data;

			if (feedbackData != null) { // Cheks if API returned any data

				var AIFeedbackMsgs = [];
				var BIFeedbackMsgs = [];

				// Sorts the feedback messages into AI and BI
				for (var i=0; i<feedbackData.length; i++) {
					if (feedbackData[i].category == '0') { // category 0 = AI
						AIFeedbackMsgs.push(feedbackData[i]);
					} else { // category 1 = BI
						BIFeedbackMsgs.push(feedbackData[i]);
					}
				}

				if (AIFeedbackMsgs.length > 0) {
					// Creates HTML for inserting into AI feedback table
					var htmlAI = '';
					for (var i=0; i<AIFeedbackMsgs.length; i++) {
						var timeCreated = moment(AIFeedbackMsgs[i].timeCreated + "Z");
						timeCreated.tz('Europe/Oslo'); // Converts time to the correct time zone

						htmlAI += "<tr>"
						+ "<td>" + timeCreated.format('YYYY-MM-DD HH:mm') + "</td>"
						+ "<td>" + AIFeedbackMsgs[i].feedbackText + "</td>"
						+ "</tr>";
					}
					$('#tableAIFeedbackMsgs tbody tr').remove(); // Removes all exisitng rows from table body
					$('#tableAIFeedbackMsgs tbody').append(htmlAI); // Inserts the generated HTML
					$('#AIFeedbackMsgsContainer').show(); // Makes table visible
				}
				
				if (BIFeedbackMsgs.length > 0) {
					// Created HTML for inserting into BI feedback table
					var htmlBI = '';
					for (var i=0; i<BIFeedbackMsgs.length; i++) {
						var timeCreated = moment(BIFeedbackMsgs[i].timeCreated + "Z");
						timeCreated.tz('Europe/Oslo'); // Converts time to the correct time zone
						
						htmlBI += "<tr>"
						+ "<td>" + timeCreated.format('YYYY-MM-DD HH:mm') + "</td>"
						+ "<td>" + BIFeedbackMsgs[i].feedbackText + "</td>"
						+ "</tr>";
					}
					$('#tableBIFeedbackMsgs tbody tr').remove(); // Removes all exisitng rows from table body
					$('#tableBIFeedbackMsgs tbody').append(htmlBI); // Inserts the generated HTML
					$('#BIFeedbackMsgsContainer').show(); // Makes table visible
				}
			} else {
				//console.log("No feedback data returned from API.");
			}
		}
	});
}



//********************************************************************
//*************** Called when clicking the logout btn. ***************
//******* Empties localstorage and redirects to the login page. ******
//********************************************************************
function logout() {
	localStorage.removeItem("firstname");
	localStorage.removeItem("lastname");
	localStorage.removeItem("userid");
	localStorage.removeItem("email");
	localStorage.removeItem("isexpert");
	localStorage.removeItem("token");

	window.location.replace("../index.html");
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
		/*
		// source: File API availability - http://caniuse.com/#feat=fileapi
		// source: <output> availability - http://html5doctor.com/the-output-element/
		document.writeln('The HTML5 APIs used in this form are only available in the following browsers:<br />');
		// 6.0 File API & 13.0 <output>
		document.writeln(' - Google Chrome: 13.0 or later<br />');
		// 3.6 File API & 6.0 <output>
		document.writeln(' - Mozilla Firefox: 6.0 or later<br />');
		// 10.0 File API & 10.0 <output>
		document.writeln(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
		// ? File API & 5.1 <output>
		document.writeln(' - Safari: Not supported<br />');
		// ? File API & 9.2 <output>
		document.writeln(' - Opera: Not supported');
		*/
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

	var file = null;
	if (isAI) {
		if (CSVFileAI != null) {
			file = CSVFileAI;
		} else {
			alert("Ingen fil er valgt.");
			return false;
		}
	} else { // BI file upload
		if (CSVFileBI != null) {
			file = CSVFileBI;
		} else {
			alert("Ingen fil er valgt.");
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
			if ((typeof data[i].dato != 'undefined') && (data[i].dato != null) && (data[i].dato != '')) {
				validData.push(data[i]);
			}
		}
			
		callAjaxPostAcitivtyIdx(validData, 0, 0, 0, isAI); // Call function to send data to API

	};
	reader.onerror = function() {
		alert('Kunne ikke lese filen ' + file.fileName);
	};

}


//********************************************************************
//******** Recursive function that sends AI or BI data to API ********
//********************************************************************
function callAjaxPostAcitivtyIdx(inputData, idx, successCounter, errorCounter, isAI) {
	var dateSplit = inputData[idx].dato.split(".");
	//var date = new Date(dateSplit[2], dateSplit[1], dateSplit[0]);

	var apiUrl = null;
	var valueFieldName = null;
	if (isAI) {
		apiUrl = "http://vavit.no/adapt-staging/api/postActivityIdx.php";
		valueFieldName = "activityIdx";
	} else {
		apiUrl = "http://vavit.no/adapt-staging/api/postBalanceIdx.php";
		valueFieldName = "balanceIdx";
	}
	
	// Builds form data string
	var formData = "userID=" + $activeUserData.userID + "&timeDataCollected=" + dateSplit[2] + "-" + dateSplit[1] + "-" + dateSplit[0] + "&" + valueFieldName + "=" + inputData[idx].ai;
	
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
			callAjaxPostAcitivtyIdx(inputData, nextIdx, successCounter, errorCounter, isAI);
		}
	});
}


/*********************************************************************/
/*Shows a toast when the data from file upload is done being processed/
/*********************************************************************/
function showNotificationActivityIdxFileUpload(successCounter, errorCounter, isAI) {
	var toastID = null;
	if (isAI) {
		toastID = "#toastActivityIdxFileUpload";
	} else {
		toastID = "#toastBalanceIdxFileUpload";
	}

	hideLoader(); // Hides the loading widget

	if (errorCounter > 0) { // If any errors: show error msg
		var total = errorCounter + successCounter;
		var plural = (total > 1) ? "er" : ""; // use plural form if more than one
		var errorMsg = errorCounter + " av " + total + " oppføring" + plural + " ble IKKE lagret i databasen.";
		showToast(toastID, false, errorMsg);
	} else { // Show success msg
		var plural = (successCounter > 1) ? "er" : ""; // use plural form if more than one
		var successMsg = successCounter + " oppføring" + plural + " ble lagret i databasen.";
		showToast(toastID, true, successMsg);
	}
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
	$("#activeUserName").html("");
	$("#headerTitleDetailView").html("");
	
	$("#cellMobilityIdx").html("");
	$("#cellBirthDate").html("");
	$("#cellAddress").html("");
	$("#cellPhoneNr").html("");
	$("#cellDateJoined").html("");
	$("#cellGender").html("");
	$("#cellWeight").html("");
	$("#cellHeight").html("");
	$("#cellFalls6").html("");
	$("#cellFall12").html("");
	$("#cellWalkingAid").html("");
	$("#cellLivingIndependently").html("");
}



/*********************************************************************/
/********* Clears all the input fields in the new user form **********/
/*********************************************************************/
function clearNewUserForm() {
	$("#inputFieldNewFirstName").val("");
	$("#inputFieldNewLastName").val("");
	$("#inputFieldNewEmail").val("");
	$("#inputFieldNewPassword").val("");
	$("#inputFieldNewBirthDate").val("");
	$("#inputFieldNewAddress").val("");
	$("#inputFieldNewZipCode").val("");
	$("#inputFieldNewCity").val("");
	$("#inputFieldNewPhone").val("");
	$("#inputFieldNewWeight").val("");
	$("#inputFieldNewHeight").val("");
	$("#inputFieldNewUsesWalkingAid").prop('checked', false).checkboxradio('refresh');
	$("#inputFieldNewLivingIndependently").prop('checked', false).checkboxradio('refresh');
}



/*********************************************************************/
/********* Clears all the input fields in the edit user form *********/
/*********************************************************************/
function clearEditUserForm() {
	$("#inputFieldEditFirstName").val("");
	$("#inputFieldEditLastName").val("");
	$("#inputFieldEditEmail").val("");
	$("#inputFieldEditAddress").val("");
	$("#inputFieldEditZipCode").val("");
	$("#inputFieldEditCity").val("");
	$("#inputFieldEditPhone").val("");
	$("#inputFieldEditWeight").val("");
	$("#inputFieldEditHeight").val("");
	$("#inputFieldEditNumFalls6Mths").val("");
	$("#inputFieldEditNumFalls12Mths").val("");
	$("#inputFieldEditUsesWalkingAid").val("");
	$("#inputFieldEditLivingIndependently").val("");
}





/*********************************************************************/
/**** Calculates the age of a user in years based on date of birth ***/
/*********************************************************************/
function calculateAge(birthDate) {
	if (birthDate != null && birthDate != "0000-00-00") {
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
	if ($activeUserData != null) {
		$fullName = $activeUserData["firstName"] + " " + $activeUserData["lastName"];
		$genderStr = ($activeUserData['isMale'] == 1) ? 'Mann' :'Kvinne';

		$usesWalkingAidBool = ($activeUserData['usesWalkingAid'] == 1);
		$usesWalkingAidStr = ($usesWalkingAidBool) ? 'Ja' :'Nei';

		$livingIndependentlyBool = ($activeUserData['livingIndependently'] == 1);
		$livingIndependentlyStr = ($livingIndependentlyBool) ? 'Ja' :'Nei';

		
		/******** Update user detail page ********/

		$("#activeUserName").html($fullName);
		$("#headerTitleDetailView").html("Brukerdetaljer - " + $fullName);
		
		$("#cellMobilityIdx").html($activeUserData["mobilityIdx"]);

		$age = calculateAge($activeUserData["birthDate"]);
		if ($age != "") {
			$("#cellBirthDate").html($activeUserData["birthDate"] + " (" + $age + " år)");
		}

		// Builds a string containing the full address for the user
		// (address (street name and number) + zip + city),
		// taking into account that some parts of it might not be set.
		$fullAddress = "";
		$isZipSet = false;
		if ($activeUserData["address"] != null) {
			$fullAddress += $activeUserData["address"];
		}
		if ($activeUserData["zipCode"] != null) {
			$isZipSet = true;
			if ($fullAddress != "") {
				$fullAddress += ", ";
			}
			$fullAddress += $activeUserData["zipCode"] + " ";
		}
		if ($activeUserData["city"] != null) {
			if ($fullAddress != "") {
				if ($isZipSet) {
					$fullAddress += " ";
				} else {
					$fullAddress += ", ";
				}
			}
			$fullAddress += $activeUserData["city"];
		}

		$("#cellAddress").html($fullAddress);
		$("#cellPhoneNr").html($activeUserData["phoneNumber"]);
		$("#cellDateJoined").html($activeUserData["dateJoinedAdapt"]);
		$("#cellGender").html($genderStr);

		if ($activeUserData["weight"] != null) {
			$("#cellWeight").html($activeUserData["weight"] + " kg");
		}

		if ($activeUserData["height"] != null) {
			$("#cellHeight").html($activeUserData["height"] + " cm");
		}
		
		if ($activeUserData["numFalls6Mths"] != null) {
			$("#cellFalls6").html($activeUserData["numFalls6Mths"]);
		}

		if ($activeUserData["numFalls12Mths"] != null) {
			$("#cellFall12").html($activeUserData["numFalls12Mths"]);
		}
		
		$("#cellWalkingAid").html($usesWalkingAidStr);
		$("#cellLivingIndependently").html($livingIndependentlyStr);


		/******** Update edit user data form ********/

		$("#inputFieldEditFirstName").val($activeUserData["firstName"]);
		$("#inputFieldEditLastName").val($activeUserData["lastName"]);
		$("#inputFieldEditEmail").val($activeUserData["email"]);
		$("#inputFieldEditAddress").val($activeUserData["address"]);
		$("#inputFieldEditZipCode").val($activeUserData["zipCode"]);
		$("#inputFieldEditCity").val($activeUserData["city"]);
		$("#inputFieldEditPhone").val($activeUserData["phoneNumber"]);
		$("#inputFieldEditWeight").val($activeUserData["weight"]);
		$("#inputFieldEditHeight").val($activeUserData["height"]);
		$("#inputFieldEditNumFalls6Mths").val($activeUserData["numFalls6Mths"]);
		$("#inputFieldEditNumFalls12Mths").val($activeUserData["numFalls12Mths"]);
		$("#inputFieldEditUsesWalkingAid").prop('checked', $usesWalkingAidBool);
		$("#inputFieldEditLivingIndependently").prop('checked', $livingIndependentlyBool);
	}
}
