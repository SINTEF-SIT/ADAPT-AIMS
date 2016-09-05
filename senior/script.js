/***************************
** Global variables
***************************/
var balanceChart; // The chart displaying the balance indexes
var activityChart; // The chart displaying the activity indexes
var userData; // Information about the logged in user
var exercises; // Information about all exercises in the system

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

$currentBalanceIdx = null // The current balance index for the logged in user
$currentActivityIdx = null; // The current activity index for the logged in user. Not currently in use!

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
	
	//$("#messageWrapperAI").hide(); // Initially hides the box displaying AI feedback messages
	//$("#messageWrapperBI").hide(); // Initially hides the box displaying BI feedback messages

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
				userData = data.data;
				if (userData.hasAccessedSystem === 0) {
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
	})).then(function(data, textStatus, jqXHR) {
		$.when($.ajax({
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
		})).then(function(data, textStatus, jqXHR) {
			var maxBalanceChartRange = 1000 * 60 * 60 * 24 * 90; // The maximum range of the x axis in milliseconds
			//var numBalanceChartSeries = 0;
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

					if (balanceChartDataJSON !== null) {
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

							var dataPoint = [];
							var date = moment.tz(balanceChartDataJSON[i].timeDataCollected, "UTC");
							dataPoint.push(date.valueOf());
							dataPoint.push(bi);
							balanceChartData.push(dataPoint);

							// If last data point from db, add a final data point 24 hours after
							// the last recorded value to make the last change visible in the chart.
							if (i+1 == balanceChartDataJSON.length) {
								var dataPointFinal = [];
								dataPointFinal.push(date.valueOf() + (1000 * 60 * 60 * 24));
								dataPointFinal.push(parseFloat(balanceChartDataJSON[i].value));
								balanceChartData.push(dataPointFinal);

								$currentBalanceIdx = balanceChartDataJSON[i].value; // Store the last data value as the current BI
								setBIImg(); // Displays the BI image corresponding to the current BI value
							}
						}

						var xAxisMinValue = null;
						if (balanceChartData[balanceChartData.length-1][0] - balanceChartData[0][0] > maxBalanceChartRange) {
							xAxisMinValue = moment().valueOf() - maxBalanceChartRange;
						}

						/*balanceChartDataSplit = splitChartSeries(balanceChartData);
						numBalanceChartSeries = balanceChartDataSplit.length;*/

						var yAxisLabels = ["Lav", "Medium", "Høy"];
						
						colorMaxBI = "#" + getBIChartData($currentBalanceIdx).color;
						colorMidBI = "#" + getBIChartData($currentBalanceIdx/2).color;
						
						balanceChartOptions = {
							chart: {
								renderTo: 'balanceChart', // ID of div where the chart is to be rendered
								//zoomType: 'x', // Uncomment to make the chart zoomable along the x-axis
								backgroundColor: null,
								reflow: true
							},
							title: {
								text: 'Din balanse over tid'
							},
							xAxis: {
								type: 'datetime',
								//maxTickInterval: 7 * 24 * 3600 * 1000, // How frequent a tick is displayed on the axis (set in milliseconds)
								min: xAxisMinValue
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
										text: 'Normalverdi', // Content of the label. 
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
									},
									color: {
										linearGradient: {
											x1: 0,
											y1: 0,
											x2: 0,
											y2: 1
										},
										stops: [
											// The 'grey' color is temporary, as the top and middle colors are calculated later.
											[0, 'grey'],
											[0.5, 'grey'],
											[1, '#ED1E24']
										]
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
								color: {
									linearGradient: {
										x1: 0,
										y1: 0,
										x2: 0,
										y2: 1
									},
									stops: [
										// The 'grey' color is temporary, as the top and middle colors are calculated later.
										[0, colorMaxBI],
										[0.5, colorMidBI],
										[1, '#ED1E24']
									]
								},
								lineWidth: 0,
			            		enableMouseTracking: false,
			            		data: balanceChartData
							}]
						};

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
						if (activityChartDataJSON !== null) {
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
									tickInterval: 1, // How frequent a tick is displayed on the axis
									plotLines: [{
										color: '#9E9E9E', // Color value
										dashStyle: 'ShortDash', // Style of the plot line. Default to solid
										value: userData.AIChartLineValue, // Value of where the line will appear
										width: 2, // Width of the line
										zIndex: 5, // Draw the plot line on top of the series
										label: { 
											text: 'Normalverdi', // Content of the label. 
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

					$.ajax({
						/***************************
						** Get all exercises
						***************************/
						url: "../api/exercises.php",
						type: 'GET',
						beforeSend: function (request) {
							request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
						},
						error: function(data, status) { // If the API request fails
							console.log("Error attempting to call API: GET request to exercises.php");
							hideLoader(); // Hides the loading widget
						},
						success: function(data, status) { // If the API request is successful
							exercises = data.data;

							var htmlBalanceExercises = "";
							var htmlActivityExercises = "";

							for (var i=0; i<exercises.length; i++) {
								var html = "<a onclick='displayExercise(" + i + ")' data-role='button'>" + exercises[i].title + "</a>";
								if (exercises[i].isBalanceExercise === 1) {
									htmlBalanceExercises += html;
								} else {
									htmlActivityExercises += html;
								}
							}
							$("#balanceExercisesBtnGroup").append(htmlBalanceExercises);
							$("#activityExercisesBtnGroup").append(htmlActivityExercises);

							hideLoader(); // Hides the loading widget
						}
					});

					/*
					var firstFeedbackAjaxCall = null;
					var secondFeedbackAjaxCall = null;

					if (activityChart) {
						var currentAI = getNewestChartValue(activityChart, 0);
						firstFeedbackAjaxCall = {
							category: '0',
							textID: 'AI',
							textStart: 'Aktivitetsråd:',
							idx: currentAI
						};
					}

					if (balanceChart) {
						currentBI = getNewestChartValue(balanceChart, 0);
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
							// Gets first feedback msg (if any)
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

									if (data.data.exerciseID !== null) {
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
								$.ajax({
									// Gets the other feedback msg (if any)
									url: "../api/feedback.php?seniorUserID=" + seniorUserID 
									+ "&idx=" + secondFeedbackAjaxCall.idx + "&category=" + secondFeedbackAjaxCall.category,
									type: 'GET',
									beforeSend: function (request) {
										request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
									},
									error: function(data, status) { // If the API request fails
										console.log("Error attempting to call API: GET request to feedback.php with parameters idx=" 
											+ secondFeedbackAjaxCall.idx + " and category=" + secondFeedbackAjaxCall.category);
									}, 
									success: function(data, status) { // If the API request is successful
										var textID = secondFeedbackAjaxCall.textID;
										if (data.data) {
											$("#feedbackMsg" + textID).html("<b>" + secondFeedbackAjaxCall.textStart 
												+ "</b> " + data.data.feedbackText); // Writes the BI feedback msg to the DOM
											$("#messageWrapper" + textID).show();

											if (data.data.exerciseID !== null) {
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
								});
							} else {
								hideLoader(); // Hides the loading widget
							}
						});
					} else {
						hideLoader(); // Hides the loading widget
					}
					*/
				});
			});
		});
	});

	// Sets global options for the charts
	Highcharts.setOptions({
		colors: ['#7CB5EC', '#66A6E3'], // Default series colors
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


function splitChartSeries(chartData) {
	// Splits the chart data into a separate serie for each month, in order to set alternating colors
	if (chartData[0][0] !== null) {
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

	if (data.imgFilename !== null && data.imgFilename !== "") {
		$("#exerciseImg" + textID).attr("src","img/exercises/" + data.imgFilename);
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

	$("#exerciseDesc" + textID).append(html);
}


function setBIImg() {
	// Updates the DOM with the BI img depending on the BI value
	var fileName = "";

	$biData = getBIChartData($currentBalanceIdx);
	if ($biData !== null) {
		$fileName = $biData.fileName;

		var imgPath = "img/BIImg/" + $fileName;
		var img = document.getElementById("BIImg");
		img.src = imgPath;

	} else {
		$("#BIImgHeader").html("<h3>Det oppstod en feil.</h3>");
		$("#BIImgInnerWrapper").hide();
	}
}


/***************************
** Time calculation
***************************/
function convertDateToUTC(date) {
	// Converts the given date to UTC format.
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); 
}

function setUpdateTimeDiff(timeCalculated) {
	// Calculates a string saying how long ago the given timestamp is from the current time.
	var timestamp = moment.tz(timeCalculated, "UTC");
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

		//$fileNames = ["0.png", "05.png", "10.png", "15.png", "20.png", "25.png", "30.png", "35.png", "40.png", "45.png", "50.png"];
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

function getNewestChartValue(chart, seriesIdx) {
	// Returns the most recent data value from a given chart
	var data = chart.series[seriesIdx].data;
	return data[data.length-1].y;
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

function displayExercise(exerciseArrayIdx) {
	var exercise = exercises[exerciseArrayIdx];
	generateExerciseHTML(exercise, "");
	$.mobile.changePage( "index.html#exercise-info-page-", { transition: "pop" });
}
