/***************************
** Global variables
***************************/
var balanceChart; // The chart displaying the balance indexes
var activityChart; // The chart displaying the activity indexes
var userData; // Information about the logged in user
var exerciseGroups; // Exercise groups and their exercises that can be recommended to the senior users

// Tooltip texts explaining what the different AI values mean.
var activityChartTooltips = ["Det er ikke registrert noe fysisk aktivitet denne dagen.", // AI = 0
	"Dette tilsvarer <i>noe</i> fysisk aktivitet (x antall skritt).", // AI = 1
	"Dette tilsvarer <i>moderat</i> fysisk aktivitet (x antall skritt).", // AI = 2
	"Dette tilsvarer over <i>middels</i> mengde fysisk aktivitet (x antall skritt).", // AI = 3
	"Dette tilsvarer <i>mye</i> fysisk aktivitet (x antall skritt).", // AI = 4
	"Dette tilsvarer <i>veldig mye</i> fysisk aktivitet (x antall skritt)."]; // AI = 5

var token; // The JWT used for communicating with the API
var seniorUserID; // The user id of the logged in user
var seniorUsername; // The username of the logged in user
var seniorFirstName; // The first name of the logged in user
var seniorLastName; // The last name of the logged in user

var currentBalanceIdx = null // The current balance index for the logged in user
var currentActivityIdx = null; // The current activity index for the logged in user.

var AIFeedbackMsgSitting = null;
var AIFeedbackMsgWalking = null;
var BIFeedbackMsg = null;

var settings; // General settings and text strings used in the system
var BIIndexSection; // -1 means the BI is in the 'low zone', 0 means medium, and 1 means high

var BIMax = 1;
var BIMin = -1;
var numBIImg = 21;


/***************************
** General
***************************/

$(document).delegate('#main-page', 'pageshow', function () {
	/************************************************************
	** Every time the main page is shown: reflow the charts
	** in case the window size has changed while on another page
	************************************************************/
	if (balanceChart !== null && typeof balanceChart !== 'undefined') balanceChart.reflow();
	if (activityChart !== null && typeof activityChart !== 'undefined') activityChart.reflow();
	$(window).trigger('resize');
});


$(document).delegate('#help-page', 'pagehide', function () {
	$('#tutorialVideoiFrameHelpPage').attr('src', "http://player.vimeo.com/video/107469289"); // Stops video playback
});


$(window).on('resize', function() {
	if (settings) {
		populateDOMTextStrings();
		$('.chartHeader').quickfit({ max: 30, min: 15, truncate: true, tolerance: 0.06 });
	}
});


$(document).ready(function() {
	$( "#video-popup" ).enhanceWithin().popup();
	$("#BIImgInnerWrapper").hide(); // Hide BI gauge chart while page is loading

	// Automatically close the chart tooltip popups after 10 seconds
	$('#BIChartTooltip').on('popupafteropen', function (e) {
		setTimeout(function(){
			$("#BIChartTooltip").popup("close");
		}, 10000);
	});

	$('#AIChartTooltip').on('popupafteropen', function (e) {
		setTimeout(function(){
			$("#AIChartTooltip").popup("close");
		}, 10000);
	});

	showLoader(); // Displays the loading widget

	// Checks if the token and user data exist in localStorage
	if (localStorage.token && localStorage.userid && localStorage.firstname && localStorage.lastname && localStorage.username) {
		// Fetches token and data about the logged in user from localStorage
		token = localStorage.token;
		seniorUserID = localStorage.userid;
		seniorFirstName = localStorage.firstname;
		seniorLastName = localStorage.lastname;
		seniorUsername = localStorage.username;
	} else {
		// Redirect to login page
		window.location.replace("../index.html");
	}

	$("#userFullName").text(seniorFirstName + " " + seniorLastName); // Writes the full name of the logged in user to the DOM

	$.ajax({
		// Get all information needed for the senior view
		url: "../api/allSeniorData.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) { // If the API request fails
			console.log("Error attempting to call API: GET request to allSeniorData.php with parameter seniorUserID=" + seniorUserID);
			hideLoader(); // Hides the loading widget
		}, 
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				userData = data.data.seniorUserDetails;

				if (userData.hasAccessedSystem === 0) {
					// This is the first time this user accesses the system.
					// Show tutorial video and store in the DB that the user has accessed the system.
					openVideoPopup();

					$.ajax({
						// Store that the user has accessed the system, preventing popup from appearing on next login
						url: "../api/hasAccessedSystem.php?seniorUserID=" + seniorUserID,
						type: 'PUT',
						beforeSend: function (request) {
							request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
						},
						error: function(data, status) { // If the API request fails
							console.log("Error attempting to call API: PUT request to hasAccessedSystem.php with parameter seniorUserID=" + seniorUserID);
						}, 
						success: function(data, status) { // If the API request is successful
							console.log(data.status_message);
						}
					});
				} else {
					closeVideoPopup();
				}

				// Settings
				settings = data.data.settings;

				// Triggers windows rezise, which in turn updates text strings
				$(window).trigger('resize');

				// Newest change time
				// Calculates the string to display to tell how long ago the information was last updated, and updates the DOM
				if (data.data.newestChangeTime) {
					setUpdateTimeDiff(data.data.newestChangeTime.timeUpdated);
				} else {
					$("#lastUpdatedWrapper").hide();
				}

				var balanceChartDataJSON = data.data.balanceIndexes;
				var activityChartDataJSON = data.data.activityIndexes;

				if (balanceChartDataJSON === null && activityChartDataJSON === null) {
					$("#BIImgWell").append("<p style='font-size: 26px'>Det er ikke registrert noe ennå.<br>Se innom igjen senere!</p>");
					$("#BIImgHeader").hide();
					$("#BIImgTooltipBtn").hide();
					$("#allExercisesHeader").hide();

				}

				if (activityChartDataJSON === null || balanceChartDataJSON === null) {
					if (activityChartDataJSON) {
						drawAIChart(activityChartDataJSON, null, null);
					} else {
						$("#activityChartContainer").hide();
					}
					if (balanceChartDataJSON) {
						drawBIChart(balanceChartDataJSON, null, null);
					} else {
						$("#balanceChartContainer").hide();
					}
				} else {
					// Both charts will be displayed. Calculates the xAxis interval to use for both charts.
					var maxChartInterval = 1000 * 60 * 60 * 24 * settings.maxXAxisIntervalDays;

					var AIFirst = moment.tz(activityChartDataJSON[0].dateFrom, "UTC").valueOf();
					var BIFirst = moment.tz(balanceChartDataJSON[0].dateFrom, "UTC").valueOf();
					var AILast = moment.tz(activityChartDataJSON[activityChartDataJSON.length-1].dateTo, "UTC").valueOf();
					var BILast = moment.tz(balanceChartDataJSON[balanceChartDataJSON.length-1].dateTo, "UTC").valueOf();

					var chartsEndTime = (AILast > BILast) ? AILast : BILast;

					var AISpan = chartsEndTime - AIFirst;
					var BISpan = chartsEndTime - BIFirst;

					var chartsInterval = (AISpan > BISpan) ? AISpan : BISpan; // Find the longest interval of the two charts
					// If the chart data interval is longer than the max interval, use the max interval
					var chartsStartTime = (chartsInterval > maxChartInterval) ? chartsEndTime-maxChartInterval : chartsEndTime-chartsInterval;

					// Draw the charts
					drawBIChart(balanceChartDataJSON, chartsStartTime, chartsEndTime);
					drawAIChart(activityChartDataJSON, chartsStartTime, chartsEndTime);
				}

				// Feedback and exercises
				if (data.data.feedback !== null) {
					var customBIFeedback = userData.showPersonalizedBIFeedback;
					var customAISittingFeedback = userData.showPersonalizedAISittingFeedback;
					var customAIWalkingFeedback = userData.showPersonalizedAIWalkingFeedback;

					for (var i=0; i<data.data.feedback.length; i++) {
						var msg = data.data.feedback[i];
						if (msg.category === 1 && msg.custom === customBIFeedback) {
							BIFeedbackMsg = msg;
						}
						if (msg.category === 0 && msg.AIFeedbackType === 0 && msg.custom === customAISittingFeedback) {
							AIFeedbackMsgSitting = msg;
						}
						if (msg.category === 0 && msg.AIFeedbackType === 1 && msg.custom === customAISittingFeedback) {
							AIFeedbackMsgWalking = msg
						}
					}
				} else {
					$("#feedbackPageContent").html("");
				}
				

				exerciseGroups = data.data.exerciseGroups;

				var htmlBalanceExercises = "";

				for (var i=0; i<exerciseGroups.length; i++) {
					var exerciseType = exerciseGroups[i].exerciseType;
					for (var j=0; j<exerciseGroups[i].exercises.length; j++) {
						var exercise = exerciseGroups[i].exercises[j]; 
						if (exercise.indexSection === BIIndexSection) {
							htmlBalanceExercises += "<a onclick='displayExercise(" + exercise.exerciseID + ")' data-role='button'>" + exercise.title + "</a>";
						}
					}
				}
				$("#balanceExercisesBtnGroup").append(htmlBalanceExercises);
				writeFeedback();

				$('div[data-role=content]').trigger('create');
				
				hideLoader(); // Hides the loading widget

			} else {
				// No data found
				console.log(data);
				$("#BIImgInnerWrapper").hide();
				$("#BIImgTooltipBtn").hide();
				$(".chartWell").hide();
				$("#BIImgHeader").html("Det har oppstått en feil.");
				hideLoader(); // Hides the loading widget
			}
		}
	});


	// Sets global options for the charts
	Highcharts.setOptions({
		colors: ['#6499CC', '#66A6E3'], // Default series colors
		lang: { // Defines Norwegian text strings used in the charts
			months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni',  'juli', 'august', 'september', 'oktober', 'november', 'desember'],
			shortMonths: ['jan.', 'feb.', 'mars', 'apr.', 'mai', 'juni',  'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'des.'],
			weekdays: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
			shortWeekdays: ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø'],
			decimalPoint: ',',
			thousandsSep: ' '
		},
		title: {
			style: {
				fontSize:'24px'
			}
		},
		yAxis: {
			labels: {
				style: {
					fontSize:'16px'
				}
			}
		},
		xAxis: {
			labels: {
				rotation: -45,
				style: {
					fontSize:'16px'
				}
			}
		}
	});
});



function drawBIChart(balanceChartDataJSON, startTime, endTime) {
	var balanceChartData = [];

	for (var i=0; i<balanceChartDataJSON.length; i++) {
		if (i != 0) {
			// Draws an extra data point right before each data point (except the first) 
			// to get a flat line instead of a straight, diagonal line between the points.
			// Needs to be commented out if the chart is switched to a column chart.
			var dataPointPre = [];
			var datePre = moment.tz(balanceChartDataJSON[i].dateFrom, "UTC");
			datePre.seconds(-1);
			dataPointPre.push(datePre.valueOf());
			dataPointPre.push(parseFloat(balanceChartDataJSON[i-1].value));
			balanceChartData.push(dataPointPre);
		}
		
		var bi = parseFloat(balanceChartDataJSON[i].value);

		var dataPoint = [];
		var date = moment.tz(balanceChartDataJSON[i].dateFrom, "UTC");
		dataPoint.push(date.valueOf());
		dataPoint.push(bi);
		balanceChartData.push(dataPoint);

		// If last data point from db, add the dateTo value as the final data point.
		if (i+1 == balanceChartDataJSON.length) {
			var dataPointFinal = [];
			var dateFinal = moment.tz(balanceChartDataJSON[i].dateTo, "UTC");
			dataPointFinal.push(dateFinal.valueOf());
			dataPointFinal.push(bi);
			balanceChartData.push(dataPointFinal);

			currentBalanceIdx = balanceChartDataJSON[i].value; // Store the last data value as the current BI

			if (currentBalanceIdx < settings.BIThresholdLower) {
				BIIndexSection = -1;
			} else if (currentBalanceIdx >= settings.BIThresholdLower && currentBalanceIdx < settings.BIThresholdUpper) {
				BIIndexSection = 0;
			} else if (currentBalanceIdx >= settings.BIThresholdUpper) {
				BIIndexSection = 1;
			}

			setBIImg(); // Displays the BI image corresponding to the current BI value
		}
	}

	if (startTime === null) {
		startTime = balanceChartData[0][0];
	}
	if (endTime === null) {
		endTIme = balanceChartData[balanceChartData.length-1][0];
	}

	var yAxisLabels = [settings.BIChartSpectrumLabelLow, settings.BIChartSpectrumLabelMedium, settings.BIChartSpectrumLabelHigh];
	
	balanceChartOptions = {
		chart: {
			renderTo: 'balanceChart', // ID of div where the chart is to be rendered
			//zoomType: 'x', // Uncomment to make the chart zoomable along the x-axis
			backgroundColor: null,
			marginLeft: 100,
			reflow: true
		},
		title: {
			text: ''
			//text: 'Din balanse over tid'
		},
		xAxis: {
			type: 'datetime',
			minTickInterval: 24 * 3600 * 1000,
			min: startTime,
			max: endTime
		},
		yAxis: {
			max: 1, // The ceiling value of the y-axis.
			min: -1, // The floor of the y-axis. 
			minRange : 0.1,
			endOnTick: false,
			alternateGridColor: '#DEE0E3',
			tickInterval: 0.2, // How frequent a tick is displayed on the axis,
			title: {
				enabled: false
			},
			plotLines: [{
				color: '#9E9E9E', // Color value
				dashStyle: 'ShortDash', // Style of the plot line. Default to solid
				value: 0, // Value of where the line will appear
				width: 2, // Width of the line
				zIndex: 5, // Draw the plot line on top of the series
				label: { 
					text: settings.BIChartLineText, // Content of the label. 
					align: 'left',
					style: {
						fontSize:'18px',
							color: '#363636'
					}
				},
				line: {
					lineWidth: 1,
					softThreshold: false
				}
			}],
			labels: {
				formatter: function() {
					return yAxisLabels[this.value+1];
				}
			}
		},
		plotOptions: {
			series: {
				pointWidth: 40,
				enableMouseTracking: false,
				marker: {
					enabled: false
				}
			}
		},
		legend: {
			enabled: false // Hides the legend showing the name and toggle option for the series
		},
		credits: {
			enabled: false // Hides the Highcharts credits
		},
		tooltip: {
			enabled: false // Hides the tooltip from being displayed while hovering
		},
		series: [{
			type: 'area',
			threshold: -1,
			fillOpacity: 1,
			lineWidth: 0,
			enableMouseTracking: false,
			data: balanceChartData
		}]
	};

	balanceChart = new Highcharts.Chart(balanceChartOptions);

	balanceChart.renderer.image('img/BIImg/gradient-bar.png', 88, 9, 12, 196).add();
}


function drawAIChart(activityChartDataJSON, startTime, endTime) {
	var activityChartData = [];
	for (var i=0; i<activityChartDataJSON.length; i++) {
		if (i !== 0) {
			// Draws an extra data point right before each data point (except the first) 
			// to get a flat line instead of a straight, diagonal line between the points.
			// Needs to be commented out if the chart is switched to a column chart.
			var dataPointPre = [];
			var datePre = moment.tz(activityChartDataJSON[i].dateFrom, "UTC");
			datePre.seconds(-1);
			dataPointPre.push(datePre.valueOf());
			dataPointPre.push(parseFloat(activityChartDataJSON[i-1].value));
			activityChartData.push(dataPointPre);
		}

		var dataPoint = [];
		var date = moment.tz(activityChartDataJSON[i].dateFrom, "UTC");
		dataPoint.push(date.valueOf());
		dataPoint.push(activityChartDataJSON[i].value);
		activityChartData.push(dataPoint);

		// If last data point from db, add the dateTo value as the final data point.
		if (i+1 === activityChartDataJSON.length) {
			var dataPointFinal = [];
			var dateFinal = moment.tz(activityChartDataJSON[i].dateTo, "UTC");
			dataPointFinal.push(dateFinal.valueOf());
			dataPointFinal.push(activityChartDataJSON[i].value);
			activityChartData.push(dataPointFinal);

			currentActivityIdx = activityChartDataJSON[i].value;
		}
	}

	if (startTime === null) {
		startTime = activityChartData[0][0];
	}
	if (endTime === null) {
		endTIme = activityChartData[activityChartData.length-1][0];
	}

	activityChartOptions = {
		chart: {
			renderTo: 'activityChart', // ID of div where the chart is to be rendered
			type: 'area', // Chart type. Can e.g. be set to 'column' or 'area'
			//zoomType: 'x', // Uncomment to make the chart zoomable along the x-axis
			marginLeft: 100, // To align with BI chart
			backgroundColor: null,
			reflow: true
		},
		title: {
			text: ''
			//text: 'Din aktivitet over tid'
		},
		xAxis: {
			type: 'datetime',
			minTickInterval: 24 * 3600 * 1000,
			min: startTime,
			max: endTime
		},
		yAxis: {
			title: {
				enabled: false
			},
			max: 5, // The ceiling of the y-axis. Needs to be updated if the range of valid values changes!
			min: 0, // The floor of the y-axis. 
			alternateGridColor: '#DEE0E3',
			tickInterval: 1, // How frequent a tick is displayed on the axis
			plotLines: [{
				color: '#9E9E9E', // Color value
				dashStyle: 'ShortDash', // Style of the plot line. Default to solid
				value: userData.AIChartLineValue, // Value of where the line will appear
				width: 2, // Width of the line
				zIndex: 5, // Draw the plot line on top of the series
				label: { 
					text: settings.AIChartLineText, // Content of the label. 
					align: 'left',
					style: {
						fontSize:'18px',
						color: '#363636'
					}
				}
			}]
		},
		plotOptions: {
			series: {
				pointWidth: 40,
				enableMouseTracking: false,
				marker: {
					enabled: false
				}
			}
		},
		legend: {
			enabled: false // Hides the legend showing the name and toggle option for the series
		},
		credits: {
			enabled: false // Hides the Highcharts credits
		},
		tooltip: {
			/*headerFormat: '',
			pointFormat: '<b>{point.x:%A %e. %B}</b> ble din aktivitetsindeks målt til <b>{point.y}</b>.<br />{point.tooltipText}'*/
			enabled: false
		},
		series: [{
			fillOpacity: 1,
			lineWidth: 0,
			enableMouseTracking: false,
			data: activityChartData
		}]
	};

	activityChart = new Highcharts.Chart(activityChartOptions);

	/*for (var i=0; i<activityChart.series[0].data.length; i++) {
		activityChart.series[0].data[i].tooltipText = activityChartTooltips[activityChartDataJSON[i].value];
	}*/
}

function populateDOMTextStrings() {
	$("#BIImgHeader").html(settings.BIImgHeader);
	$("#BIChartHeader").html(settings.BIChartHeader);
	$("#AIChartHeader").html(settings.AIChartHeader);

	$("#BIGaugeChartTextHighRisk").html(settings.BIImgLabelLow);
	$("#BIGaugeChartTextLowRisk").html(settings.BIImgLabelHigh);

	$("#BIImgHelpTooltipText").html(settings.BIImgHelpTooltipText);
	$("#BIChartHelpTooltipText").html(settings.BIChartHelpTooltipText);
	$("#AIChartHelpTooltipText").html(settings.AIChartHelpTooltipText);
}

function writeFeedback() {
	if (BIFeedbackMsg !== null) {
		$("#balanceFeedbackContainer").append(BIFeedbackMsg.feedbackText);
		
		var balanceExercise = getExercise(BIFeedbackMsg.balanceExerciseID);
		var strengthExercise = getExercise(BIFeedbackMsg.strengthExerciseID);
		
		generateExerciseHTML(balanceExercise, "balanceExercise");
		generateExerciseHTML(strengthExercise, "strengthExercise");
	}

	if (AIFeedbackMsgSitting !== null) {
		$("#activityFeedbackContainer").append("<b>Sitte mindre: </b>" + AIFeedbackMsgSitting.feedbackText);
	}
	if (AIFeedbackMsgWalking !== null) {
		$("#activityFeedbackContainer").append("<br><br><b>Gå mer: </b>" + AIFeedbackMsgWalking.feedbackText);
	}
}


function setBIImg() {
	// Updates the DOM with the BI img depending on the BI value
	var fileName = "";

	$biData = getBIChartData(currentBalanceIdx);
	if ($biData !== null) {
		$fileName = $biData.fileName;

		var imgPath = "img/BIImg/" + $fileName;
		var img = document.getElementById("BIImg");
		img.src = imgPath;
		$("#BIImgInnerWrapper").show();

	} else {
		$("#BIImgHeader").html("<h3>Det oppstod en feil.</h3>");
	}
}


function setUpdateTimeDiff(timeUpdated) {
	// Calculates a string saying how long ago the given timestamp is from the current time.
	var timestamp = moment.tz(timeUpdated, "UTC");
	$updateTimeDiffText = "";
	$milliDiff = moment().valueOf() - timestamp.valueOf();
	if (isNaN($milliDiff)) {
		$("#lastUpdatedWrapper").hide();
	} else {
		$secDiff = $milliDiff / 1000;
		if ($secDiff < 60) {
			$updateTimeDiffText = "Akkurat nå";
		} else {
			$minDiff = $secDiff / 60;
			if ($minDiff < 60) {
				$updateTimeDiffText = Math.floor($minDiff) + " min. siden";
			} else {
				$hourDiff = $minDiff / 60;
				if ($hourDiff < 24) {
					if ($hourDiff < 2) {
						$updateTimeDiffText = "1 time siden";
					} else {
						$updateTimeDiffText = Math.floor($hourDiff) + " timer siden";
					}
				} else {
					$daysDiff = $hourDiff / 24;
					if ($daysDiff < 2) {
						$updateTimeDiffText = "1 dag siden";
					} else {
						$updateTimeDiffText = Math.floor($daysDiff) + " dager siden";
					}
				}
			}
		}
		$("#lastUpdatedValue").text($updateTimeDiffText); // Writes string to DOM
	}
}



/***************************
** Misc
***************************/
function getBIChartData(BI) {
	// Returns a filename for the BI img and a hex color value for the BI chart
	// that corresponds to a given BI value.
	if (BI !== null && BI >= -1 && BI <= 1) {
		var step = (BIMax-BIMin) * 1.0 / numBIImg; // the BI value between two BI images 

		var colors = ["ED1E24", "F03223", "F44D22", "F76E20", "F78F1F", "F7AE1F", "F7CC1F", "F7E11F", "F6EC1F", "EEEC21", 
			"E4EC23", "D8EC27", "CBEC2A", "BCE82E", "ADE132", "9EDA36", "8FD339", "7ECA3E", "73C541", "68C043", "68BF44"];

		if (BI < BIMin+step) { // lowest section
			return {
				"fileName": "0.png",
				"color": colors[0]
			};
		} else if (BI >= BIMax-step) { // highest section
			return {
				"fileName": "100.png",
				"color": colors[numBIImg-1]
			};
		}

		for (var i=1; i<numBIImg-1; i++) { // 19 loops, one for each possible BI image except the first and last one
			if (BI >= BIMin+(i*step) && BI < BIMin+((i+1)*step)) {
				var filename = i*5;
				if (filename === 5) {
					filename = "05.png";
				} else {
					filename += ".png";
				}
				return {
					"fileName": filename,
					"color": colors[i]
				};
			}
		}
	}
	return null;
}

function openVideoPopup() {
	$('#tutorialVideoiFramePopup').attr('src', "http://player.vimeo.com/video/107469289?autoplay=1"); // Starts video playback
	$("#video-popup").popup("open", {transition:"slideup"});
}

function closeVideoPopup() {
	$("#video-popup").popup("close", {transition:"pop"});
	$('#tutorialVideoiFramePopup').attr('src', "http://player.vimeo.com/video/107469289"); // Stops video playback
	$('#tutorialVideoiFrameHelpPageWrapper').append("<iframe id='tutorialVideoiFrameHelpPage' src='http://player.vimeo.com/video/107469289' width='497' height='298' seamless webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>");
	//$('tutorialVideoiFrameHelpPage').attr('src', "http://player.vimeo.com/video/107469289"); // Sets the url for the iframe on the help page
}

function displayExercise(exerciseID) {
	var exercise = getExercise(exerciseID);
	if (exercise !== null) {
		generateExerciseHTML(exercise, "exercise");
		$.mobile.changePage( "index.html#exercise-info-page", { transition: "pop" });
	}
}

function generateExerciseHTML(data, idSelectorStart) {
	// Builds a HTML string for an exercise to be inserted into the DOM
	$("#" + idSelectorStart + "Header").html(data.title);

	if (data.imgFilename !== null && data.imgFilename !== "") {
		$("#" + idSelectorStart + "Img").attr("src","img/exercises/" + data.imgFilename);
	}

	var html = "";
	if (data.textPreList !== null) {
		html += "<p>" + data.textPreList + "</p>";
	}

	if (data.textList !== null) {
		html += "<ul>";
		var listItems = data.textList.split(";");
		for (var i=0; i<listItems.length; i++) {
			html += "<li>" + listItems[i] + "</li>";
		}
		html += "</ul>";
	}

	if (data.textPostList !== null) {
		html += "<p>" + data.textPostList + "</p>";
	}

	if (data.textPostListBold !== null) {
		html += "<strong>" + data.textPostListBold + "</strong>";
	}

	$("#" + idSelectorStart + "Desc").html(html);
}


function getExercise(exerciseID) {
	for (var i=0; i<exerciseGroups.length; i++) {
		for (var j=0; j<exerciseGroups[i].exercises.length; j++) {
			var exercise = exerciseGroups[i].exercises[j];
			if (exercise.exerciseID === exerciseID) {
				return exercise;
			}
		}
	}
	return null;
}