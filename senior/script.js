/***************************
** Global variables
***************************/
var mobilityChart; // The chart displaying the mobilirt indexes
var balanceChart; // The chart displaying the balance indexes
var activityChart; // The chart displaying the activity indexes
var MIImgID; // ID identifying the image used to represent the MI
var oldMIImgID; // Stores the previously selected MI img when a new img is selected, for rollback if the user cancels the changes

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

$currentMobilityIdx = null; // The current mobility index for the logged in user
$currentActivityIdx = null; // The current activity index for the logged in user. Not currently in use!

//$isFooterVisible = true;


/***************************
** General
***************************/

$(document).delegate('#main-page', 'pageshow', function () {
	/************************************************************
	** Every time the main page is shown: reflow the charts
	** in case the window size has changed while on another page
	************************************************************/
	if (balanceChart != null) balanceChart.reflow();
	if (activityChart != null) activityChart.reflow();
});


$(document).delegate('#details-page', 'pageshow', function () {
	if (mobilityChart != null) mobilityChart.reflow();
});

$(document).delegate('#help-page', 'pagehide', function () {
	$('#tutorialVideoiFrameHelpPage').attr('src', "http://player.vimeo.com/video/107469289"); // Stops video playback
});


$(document).ready(function() {

	$( "#video-popup" ).enhanceWithin().popup();

	
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
	
	$("#messageWrapperAI").hide(); // Initially hides the box displaying AI feedback messages
	$("#messageWrapperBI").hide(); // Initially hides the box displaying BI feedback messages

	$("#userFullName").text(seniorFirstName + " " + seniorLastName); // Writes the full name of the logged in user to the DOM

	$.when($.ajax({
		/***************************
		** Get user details
		***************************/
		url: "../api/seniorUserData.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) { // If the API request fails
			console.log("Error attempting to call API: GET request to seniorUserData.php with parameter seniorUserID=" + seniorUserID);
		}, 
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				if (data.data.hasAccessedSystem == 0) {
					// This is the first time this user accesses the system.
					// Show tutorial video and store in the DB that the user has accessed the system.
					openVideoPopup();

					$.ajax({
						/***************************
						** Get user details
						***************************/
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
			} else {
				// No data found
				console.log(data.status_message);
			}
		}
	}), $.ajax({
		/***************************
		** Timestamp of most recent update
		***************************/
		url: "../api/newestChangeTime.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) { // If the API request fails
			console.log("Error attempting to call API: GET request to newestChangeTime.php with parameter seniorUserID=" + seniorUserID);
		}, 
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				var updateTimeDiffText = setUpdateTimeDiff(data.data.timeCalculated); // Calculates the string to display to tell how long ago the information was last updated, and updates the DOM
			} else {
				// No data registered for this user yet
				console.log(data.status_message);
			}
		}
	}), $.ajax({
		//********************************************************************
		//********** Get mobility indexes to populate the MI chart ***********
		//********************************************************************
		url: "../api/mobilityIdx.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) {
			console.log("Error attempting to call API: GET request to mobilityIdx.php with parameter seniorUserID=" + seniorUserID);
			hideLoader(); // Hides the loading widget
		}, 
		success: function(data, status) { // If the API request is successful
			var mobilityChartDataJSON = data.data;
			
			if (data.data != null) { // Check if API returned any MI values
				var mobilityChartData = [];
				for (var i=0; i<mobilityChartDataJSON.length; i++) {
					if (i != 0) {
						// Draws an extra data point right before each data point (except the first) 
						// to get a flat line instead of a straight, diagonal line between the points.
						// Needs to be commented out if the chart is switched to a column chart.
						var dataPointPre = [];
						var datePre = new Date(mobilityChartDataJSON[i].timeDataCollected);
						datePre.setSeconds(datePre.getSeconds() - 1);
						dataPointPre.push(datePre.getTime());
						dataPointPre.push(parseFloat(mobilityChartDataJSON[i-1].value));
						mobilityChartData.push(dataPointPre);
					}

					var dataPoint = [];
					var date = Date.parse(mobilityChartDataJSON[i].timeDataCollected);
					dataPoint.push(date);
					dataPoint.push(parseFloat(mobilityChartDataJSON[i].value));
					mobilityChartData.push(dataPoint);

					// If last data point from db, add a final data point at the current datetime
					if (i+1 == mobilityChartDataJSON.length) {
						var finalMI = parseFloat(mobilityChartDataJSON[i].value);
						var dataPointFinal = [];
						dataPointFinal.push(new Date().getTime());
						dataPointFinal.push(finalMI);
						mobilityChartData.push(dataPointFinal);

						// Store the last data value as the current MI
						$currentMobilityIdx = finalMI;
						readCookieMIImg(); // Checks if a cookie is set for picking an MI img, then sets the source for this MI img
					}
				}

				mobilityChartOptions = {
					chart: {
						renderTo: 'mobilityChart', // ID of div where the chart is to be rendered
						type: 'area', // Chart type. Can e.g. be set to 'column' or 'area'
						zoomType: 'x', // The chart is zoomable along the x-axis by clicking and draging over a portion of the chart
						backgroundColor: null,
						reflow: true
					},
					title: {
						text: 'Mobilitetsindeks over tid'
					},
					xAxis: {
						type: 'datetime',
						minTickInterval: 24 * 3600 * 1000 // How frequent a tick is displayed on the axis (set in milliseconds)
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
					tooltip: {
						enabled: false // Hides the tooltip from being displayed while hovering
					},
					series: [{
						enableMouseTracking: false
					}]
				};

				mobilityChartOptions.series[0].data = mobilityChartData;
				mobilityChart = new Highcharts.Chart(mobilityChartOptions);
			} else {
				// No MI registered for this user yet
				$("#MIImgHeader").html("<h3>Det er ikke registrert noen mobilitetsindeks ennå.</h3>"); // Writes to DOM
				$("#MIImgInnerWrapper").hide(); // Hides the MI image

				// Hides the button for opening the MI chart popup
				$("#michartOpenBtnSettingsPage").hide();
			}
		}
	})).then(function(data, textStatus, jqXHR) {
		$.when($.ajax({
			/***************************
			** Balance chart
			***************************/
			url: "../api/balanceIdx.php?seniorUserID=" + seniorUserID,
			type: 'GET',
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			error: function(data, status) { // If the API request fails
				$("#balanceChartContainer").hide(); // Hide BI chart
				console.log("Error attempting to call API: GET request to balanceIdx.php with parameter seniorUserID=" + seniorUserID);
			}, 
			success: function(data, status) { // If the API request is successful
				var balanceChartDataJSON = data.data;
				var balanceChartData = [];

				if (balanceChartDataJSON != null) {
					//var maxBI = 0; // The highest BI value in the series
					
					for (var i=0; i<balanceChartDataJSON.length; i++) {
						if (i != 0) {
							// Draws an extra data point right before each data point (except the first) 
							// to get a flat line instead of a straight, diagonal line between the points.
							// Needs to be commented out if the chart is switched to a column chart.
							var dataPointPre = [];
							var datePre = moment.tz(balanceChartDataJSON[i].timeDataCollected, "UTC");
							datePre.seconds(-1);
							dataPointPre.push(datePre.valueOf());
							dataPointPre.push(parseFloat(balanceChartDataJSON[i-1].value));
							balanceChartData.push(dataPointPre);
						}

						
						var bi = parseFloat(balanceChartDataJSON[i].value);
						//if (bi > maxBI) maxBI = mi;

						var dataPoint = [];
						var date = moment.tz(balanceChartDataJSON[i].timeDataCollected, "UTC");
						dataPoint.push(date.valueOf());
						dataPoint.push(bi);
						balanceChartData.push(dataPoint);

						// If last data point from db, add a final data point at the current datetime
						/*if (i+1 == balanceChartDataJSON.length) {
							var dataPointFinal = [];
							dataPointFinal.push(moment().valueOf());
							dataPointFinal.push(parseFloat(balanceChartDataJSON[i].value));
							balanceChartData.push(dataPointFinal);
						}*/
					}

					balanceChartDataSplit = splitChartSeries(balanceChartData);
					
					balanceChartOptions = {
						chart: {
							renderTo: 'balanceChart', // ID of div where the chart is to be rendered
							type: 'area', // Chart type. Can e.g. be set to 'column' or 'area'
							//zoomType: 'x', // Uncomment to make the chart zoomable along the x-axis
							backgroundColor: null,
							reflow: true
						},
						title: {
							text: 'Din balanse'
						},
						xAxis: {
							type: 'datetime',
							tickInterval: 7 * 24 * 3600 * 1000, // How frequent a tick is displayed on the axis (set in milliseconds)
							min: new Date().getTime() - (90 * 24 * 3600 * 1000) // Set start of x-axis to 1 month ago
						},
						yAxis: {
							max: 5, // The ceiling value of the y-axis.
							min: 0, // The floor of the y-axis. 
							endOnTick: false,
							alternateGridColor: '#DEE0E3',
							tickInterval: 1, // How frequent a tick is displayed on the axis,
							title: {
								enabled: false
							},
						},
						plotOptions: {
							series: {
								pointWidth: 40,
								lineWidth: 0,
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
						series: [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]
					};

					for (var i=0; i<balanceChartDataSplit.length && i<24; i++) {
						balanceChartOptions.series[i].data = balanceChartDataSplit[i];
					}

					balanceChart = new Highcharts.Chart(balanceChartOptions);
				} else {
					// No BI values registered. BI chart is hidden.
					$("#balanceChartContainer").hide();
					//$("#balanceChart").html("<h3>Det er ikke registrert noen data om din balanse ennå.</h3>");
				}
			}
		})).then(function(data, textStatus, jqXHR) {
			$.when($.ajax({
				/***************************
				** Activity chart
				***************************/
				url: "../api/activityIdx.php?seniorUserID=" + seniorUserID,
				type: 'GET',
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				error: function(data, status) { // If the API request fails
					$("#activityChartContainer").hide(); // Hide AI chart
					console.log("Error attempting to call API: GET request to activityIdx.php with parameter seniorUserID=" + seniorUserID);
				}, 
				success: function(data, status) { // If the API request is successful
					var activityChartDataJSON = data.data;
					if (activityChartDataJSON != null) {
						var activityChartData = [];
						for (var i=0; i<activityChartDataJSON.length; i++) {
							// Uncomment if chart is area chart!
							/*if (i != 0) {
								// Draws an extra data point right before each data point (except the first) 
								// to get a flat line instead of a straight, diagonal line between the points.
								var dataPointPre = [];
								var datePre = new Date(activityChartDataJSON[i].timeDataCollected);
								datePre.setSeconds(datePre.getSeconds() - 1);
								dataPointPre.push(datePre.getTime());
								dataPointPre.push(activityChartDataJSON[i-1].value);
								activityChartData.push(dataPointPre);
							}*/

							var dataPoint = [];
							var date = moment.tz(activityChartDataJSON[i].timeDataCollected, "UTC");
							dataPoint.push(date.valueOf());
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
								//zoomType: 'x', // Uncomment to make the chart zoomable along the x-axis
								backgroundColor: null,
								reflow: true
							},
							title: {
								text: 'Din fysiske aktivitet'
							},
							xAxis: {
								type: 'datetime',
								tickInterval: 24 * 3600 * 1000, // How frequent a tick is displayed on the axis (set in milliseconds)
								min: new Date().getTime() - (31 * 24 * 3600 * 1000) // Set start of x-axis to 1 month ago
							},
							yAxis: {
								title: {
									enabled: false
								},
								max: 5, // The ceiling of the y-axis. Needs to be updated if the range of valid values changes!
								min: 0, // The floor of the y-axis. 
								alternateGridColor: '#DEE0E3',
								tickInterval: 1 // How frequent a tick is displayed on the axis
							},
							plotOptions: {
								series: {
									//pointWidth: 20
								}
							},
							legend: {
								enabled: false // Hides the legend showing the name and toggle option for the series
							},
							credits: {
								enabled: false // Hides the Highcharts credits
							},
							tooltip: {
								headerFormat: '',
								pointFormat: '<b>{point.x:%A %e. %B}</b> ble din aktivitetsindeks målt til <b>{point.y}</b>.<br />{point.tooltipText}'
							},
							series: [{}]
						};

						activityChartOptions.series[0].data = activityChartData;

						activityChart = new Highcharts.Chart(activityChartOptions);

						for (var i=0; i<activityChart.series[0].data.length; i++) {
							activityChart.series[0].data[i].tooltipText = activityChartTooltips[activityChartDataJSON[i].value];
						}
					} else {
						$("#activityChartContainer").hide();
						//$("#activityChart").html("<h3>Det er ikke registrert noen aktivitetsdata ennå.</h3>");
					}
				}
			})).then(function(data, textStatus, jqXHR) {

				var firstFeedbackAjaxCall = null;
				var secondFeedbackAjaxCall = null;

				if (activityChart) {
					var currentAI = getNewestChartValue(activityChart);
					firstFeedbackAjaxCall = {
						category: '0',
						textID: 'AI',
						textStart: 'Aktivitetsråd:',
						idx: currentAI
					};
				}

				if (balanceChart) {
					currentBI = getNewestChartValue(balanceChart);
					var BITemp = {
						category: '1',
						textID: 'BI',
						textStart: 'Balanseråd:',
						idx: currentBI
					};

					if (activityChart) {
						secondFeedbackAjaxCall = BITemp;
					} else {
						firstFeedbackAjaxCall = BITemp;
					}
				}

				if (firstFeedbackAjaxCall) {
					$.when($.ajax({
						/***************************
						** Gets first feedback msg (if any)
						***************************/
						url: "../api/feedback.php?seniorUserID=" + seniorUserID 
							+ "&idx=" + firstFeedbackAjaxCall.idx + "&category=" + firstFeedbackAjaxCall.category,
						type: 'GET',
						beforeSend: function (request) {
							request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
						},
						error: function(data, status) { // If the API request fails
							console.log("Error attempting to call API: GET request to feedback.php with parameters idx=" 
								+ firstFeedbackAjaxCall.idx + " and category=" + firstFeedbackAjaxCall.category);
						}, 
						success: function(data, status) { // If the API request is successful
							var textID = firstFeedbackAjaxCall.textID;
							if (data.data) {
								$("#feedbackMsg" + textID).html("<b>" + firstFeedbackAjaxCall.textStart 
									+ "</b> " + data.data.feedbackText); // Writes the AI feedback msg to the DOM
								$("#messageWrapper" + textID).show();

								if (data.data.exerciseID != null) {
									// If an exercise is linked to this feedback msg: insert exercise info into DOM
									var exerciseHTML = generateExerciseHTML(data.data, textID);

									// Creates a click listener on the message box
									setFeedbackMsgClickListnerer(textID);
								}
							} else {
								// No feedback msg is found
								console.log(data.status_message);
							}
						}
					})).then(function(data, textStatus, jqXHR) {
						if (secondFeedbackAjaxCall) {
							$.when($.ajax({
								/***************************
								** Gets the other feedback msg (if any)
								***************************/
								url: "../api/feedback.php?seniorUserID=" + seniorUserID 
								+ "&idx=" + secondFeedbackAjaxCall.idx + "&category=" + secondFeedbackAjaxCall.category,
								type: 'GET',
								beforeSend: function (request) {
									request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
								},
								error: function(data, status) { // If the API request fails
									hideLoader(); // Hides the loading widget
									console.log("Error attempting to call API: GET request to feedback.php with parameters idx=" 
										+ secondFeedbackAjaxCall.idx + " and category=" + secondFeedbackAjaxCall.category);
								}, 
								success: function(data, status) { // If the API request is successful
									var textID = secondFeedbackAjaxCall.textID;
									if (data.data) {
										$("#feedbackMsg" + textID).html("<b>" + secondFeedbackAjaxCall.textStart 
											+ "</b> " + data.data.feedbackText); // Writes the BI feedback msg to the DOM
										$("#messageWrapper" + textID).show();

										if (data.data.exerciseID != null) {
											// If an exercise is linked to this feedback msg: insert exercise info into DOM
											var exerciseHTML = generateExerciseHTML(data.data, textID);
											
											// Creates a click listener on the message box
											setFeedbackMsgClickListnerer(textID);
										}
									} else {
										// No feedback msg is found
										console.log(data.status_message);
									}
									hideLoader(); // Hides the loading widget
								}
							}));
						} else {
							hideLoader(); // Hides the loading widget
						}	
					});
				} else {
					hideLoader(); // Hides the loading widget
				}
			});
		});
	});

	// Sets global options for the charts
	Highcharts.setOptions({
		colors: ['#7CB5EC', '#66A6E3'], // Default series colors
		lang: { // Defines Norwegian text strings used in the charts
			months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni',  'juli', 'august', 'september', 'oktober', 'november', 'desember'],
			shortMonths: ['jan', 'feb', 'mars', 'apr', 'mai', 'juni',  'juli', 'aug', 'sep', 'okt', 'nov', 'des'],
			weekdays: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
			shortWeekdays: ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø']
		}
	});
});


function splitChartSeries(chartData) {
	// Splits the chart data into a separate serie for each month, in order to set alternating colors
	if (chartData[0][0] != null) {
		var chartDataSplit = [];
		var firstDate = moment(chartData[0][0]);
		var monthToCheck = firstDate.month();
		var serie = [];

		for (var i=0; i<chartData.length; i++) {
			var date = moment(chartData[i][0]);
			if (date.month() == monthToCheck) {
				serie.push(chartData[i]);
			} else {
				monthToCheck = date.month();

				var dateNewMonth = moment([date.year(), date.month()]).valueOf();

				var dataPointNewMonth = [];
				dataPointNewMonth.push(dateNewMonth);
				dataPointNewMonth.push(chartData[i-1][1]);
				serie.push(dataPointNewMonth);

				chartDataSplit.push(serie);

				serie = [];
				dataPointNewMonth[0] += 1;
				serie.push(dataPointNewMonth);
				serie.push(chartData[i]);
			}

			if (i+1 == chartData.length) {
				chartDataSplit.push(serie);
			}
		}
		return chartDataSplit;
	} else {
		return chartData;
	}
}


function setFeedbackMsgClickListnerer(textID) {
	// Click listeners on feedback messages boxes
	$("#feedbackMsg" + textID).addClass("clickableFeedback");
	$("#messageWrapper" + textID).click(function() {
		$.mobile.changePage( "index.html#exercise-info-page-" + textID, { transition: "pop" });
	});
}


function generateExerciseHTML(data, textID) {
	// Builds a HTML string for an exercise to be inserted into the DOM
	$("#exerciseHeader" + textID).html(data.title);
	$("#exerciseImg" + textID).attr("src","img/exercises/" + data.imgFilename);

	var html = "";
	if (data.textPreList != null) {
		html += "<p>" + data.textPreList + "</p>";
	}

	if (data.textList != null) {
		html += "<ul>";
		var listItems = data.textList.split(";");
		for (var i=0; i<listItems.length; i++) {
			html += "<li>" + listItems[i] + "</li>";
		}
		html += "</ul>";
	}

	if (data.textPostList != null) {
		html += "<p>" + data.textPostList + "</p>";
	}

	if (data.textPostListBold != null) {
		html += "<strong>" + data.textPostListBold + "</strong>";
	}

	$("#exerciseDesc" + textID).append(html);
}




/***************************
** Cookies
***************************/
function readCookieMIImg() {
	// Read the cookie value to determine which of the MI img options to initially use
	var MIImgIDCookie=getCookie("MIImgID");
	if (MIImgIDCookie!="") {
		MIImgID = MIImgIDCookie;
	} else {
		MIImgID = "MIImg3";
	}
	oldMIImgID = MIImgID;
	setMMImg();
}


function setCookie(cname, cvalue, exdays) {
	// Writes a cookie
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
	// Get a cookie with a given name
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length,c.length);
		}
	}
	return "";
}



/***************************
** Selection of MI image
***************************/
/*document.getElementById("MIImgSelectionGroup").addEventListener("click", function(e) {
	if (e.target !== e.currentTarget) {
		var clickedID = e.target.id;
			if (clickedID != MIImgID && clickedID != null) {
				if (clickedID == oldMIImgID) {
					showSaveAndCancelBtns(false);
				} else {
					showSaveAndCancelBtns(true);
				}

				MIImgID = clickedID;
				setMMImg();
			}
	}
	e.stopPropagation();
}, false);*/

function setMMImg() {
	// Updates the DOM with the MI img depending on the MI value
	var fileName = "";

	$miData = getMIChartData($currentMobilityIdx);
	if ($miData != null) {
		$fileName = $miData.fileName;

		var imgPath = "img/MIImg/" + $fileName;
		var img = document.getElementById("MIImg");
		img.src = imgPath;

		//var imgHtml = "<img src=img/MIImg/" + $fileName +" alt='Mobility index' id='MIImg'/>";
		//$("#MIImgInnerWrapper").append(imgHtml);

	} else {
		$("#MIImgHeader").html("<h3>Det oppstod en feil.</h3>");
		$("#MIImgInnerWrapper").hide();
	}

	/*var imgPath = "img/MIImg/" + $currentMobilityIdx + "/" + MIImgID + ".png";
	var img = document.getElementById("MIImg");
	img.src = imgPath;
	setCorrectBorder();*/
}

function setCorrectBorder() {
	// Sets a css class to the current MI img to give 
	// it a border to indicate that it is selected.
	var imgGroup = document.getElementById("MIImgSelectionGroup");
	var children = imgGroup.children;
	for (var i = 0; i < children.length; i++) {
		var img = children[i];
		if (img.id == MIImgID) {
			img.className = "MIImgSelected";
		} else {
			img.className = "";
		}
	}
}

function showSaveAndCancelBtns(show) {
	// If a different MI img is selected, the 'back' button needs to 
	// be replaced with a 'save' and 'cancel' button, and vice versa.

	var backBtn = document.getElementById("backBtn");
	//var saveBtn = document.getElementById("saveBtn");
	//var cancelBtn = document.getElementById("cancelBtn");

	if (show) {
		backBtn.style.display = "none";
		//saveBtn.style.display = "block";
		//cancelBtn.style.display = "block";
	} else {
		backBtn.style.display = "block";
		//saveBtn.style.display = "none";
		//cancelBtn.style.display = "none";
	}
}

function saveChanges() {
	oldMIImgID = MIImgID; // Stores the previous MI img
	closeSettingsView();
}

function cancelChanges() {
	MIImgID = oldMIImgID; // fallback to the old MI img
	setMMImg(); // Updates the DOM with the old MI img
	closeSettingsView();
	setTimeout(function () {
		// Returns to the main page 
		$.mobile.changePage( "#main-page", { transition: "flip"}); 
	}, 1);
}

function closeSettingsView() {
	showSaveAndCancelBtns(false); // Hides the save and cancel buttons
	setCookie("MIImgID", MIImgID, 7); // Stores the selected MI img as a cookie

	// Need to reflow the charts in case the window has resized while in settings view.
	/*setTimeout(function () { 
		activityChart.reflow();
		balanceChart.reflow();
	}, 500);*/
}


/***************************
** Time calculation
***************************/
function convertDateToUTC(date) {
	// Converts the given date to UTC format.
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); 
}

function setUpdateTimeDiff(timeCalculated) { // example: 2016-07-26 11:23:37
	// Calculates a string saying how long ago the given timestamp is from the current time.
	var timestamp = moment.tz(timeCalculated, "UTC");
	$updateTimeDiffText = "";
	$milliDiff = moment().valueOf() - timestamp.valueOf();
	if (isNaN($milliDiff)) {
		//$("#lastUpdatedWrapper").hide();
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
function getMIChartData($mi) {
	// Returns a filename for the MI img and a hex color value for the BI chart
	// that corresponds to a given MI value.
	if ($mi >= 0 && $mi <= 1) {
		$fileName = "";
		$color = "";

		if ($mi < 0.025) {
			$fileName = "0.png";
			$color = "ED1E24";
		} else if ($mi >= 0.025 && $mi < 0.075) {
			$fileName = "05.png";
			$color = "F03223";
		} else if ($mi >= 0.075 && $mi < 0.125) {
			$fileName = "10.png";
			$color = "F44D22";
		} else if ($mi >= 0.125 && $mi < 0.175) {
			$fileName = "15.png";
			$color = "F76E20";
		} else if ($mi >= 0.175 && $mi < 0.225) {
			$fileName = "20.png";
			$color = "F78F1F";
		} else if ($mi >= 0.225 && $mi < 0.275) {
			$fileName = "25.png";
			$color = "F7AE1F";
		} else if ($mi >= 0.275 && $mi < 0.325) {
			$fileName = "30.png";
			$color = "F7CC1F";
		} else if ($mi >= 0.325 && $mi < 0.375) {
			$fileName = "35.png";
			$color = "F7E11F";
		} else if ($mi >= 0.375 && $mi < 0.425) {
			$fileName = "40.png";
			$color = "F6EC1F";
		} else if ($mi >= 0.425 && $mi < 0.475) {
			$fileName = "45.png";
			$color = "EEEC21";
		} else if ($mi >= 0.475 && $mi < 0.525) {
			$fileName = "50.png";
			$color = "E4EC23";
		} else if ($mi >= 0.525 && $mi < 0.575) {
			$fileName = "55.png";
			$color = "D8EC27";
		} else if ($mi >= 0.575 && $mi < 0.625) {
			$fileName = "60.png";
			$color = "CBEC2A";
		} else if ($mi >= 0.625 && $mi < 0.675) {
			$fileName = "65.png";
			$color = "BCE82E";
		} else if ($mi >= 0.675 && $mi < 0.725) {
			$fileName = "70.png";
			$color = "ADE132";
		} else if ($mi >= 0.725 && $mi < 0.775) {
			$fileName = "75.png";
			$color = "9EDA36";
		} else if ($mi >= 0.775 && $mi < 0.825) {
			$fileName = "80.png";
			$color = "8FD339";
		} else if ($mi >= 0.825 && $mi < 0.875) {
			$fileName = "85.png";
			$color = "7ECA3E";
		} else if ($mi >= 0.875 && $mi < 0.925) {
			$fileName = "90.png";
			$color = "73C541";
		} else if ($mi >= 0.925 && $mi < 0.975) {
			$fileName = "95.png";
			$color = "68C043";
		} else {
			$fileName = "100.png";
			$color = "68BF44";
		}

		return {
			"fileName": $fileName,
			"color": $color
		};
	} else {
		return null;
	}
}

function getNewestChartValue(chart) {
	// Returns the most recent data value from a given chart
	var data = chart.series[0].data;
	return data[data.length-1].y;
}

function openVideoPopup() {
	console.log("openVideoPopup");
	$('#tutorialVideoiFramePopup').attr('src', "http://player.vimeo.com/video/107469289?autoplay=1"); // Starts video playback
	$("#video-popup").popup("open", {transition:"slideup"});
}

function closeVideoPopup() {
	console.log("closeVideoPopup");
	$("#video-popup").popup("close", {transition:"pop"});
	$('#tutorialVideoiFramePopup').attr('src', "http://player.vimeo.com/video/107469289"); // Stops video playback
	$('#tutorialVideoiFrameHelpPageWrapper').append("<iframe id='tutorialVideoiFrameHelpPage' src='http://player.vimeo.com/video/107469289' width='497' height='298' seamless webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>");
	//$('tutorialVideoiFrameHelpPage').attr('src', "http://player.vimeo.com/video/107469289"); // Sets the url for the iframe on the help page
}

/*function openConfirmOpenMIChartPopup() {
	$("#confirmOpenMIChartPopup").popup("open");
}

function openMIChartPopup() {
	$.mobile.changePage( "#mi-chart-popup", { transition: "pop"}); 
}*/