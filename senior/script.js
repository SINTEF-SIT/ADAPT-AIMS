/***************************
** Global variables
***************************/
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
var seniorEmail; // The email of the logged in user
var seniorFirstName; // The first name of the logged in user
var seniorLastName; // The last name of the logged in user

$currentMobilityIdx = null; // The current mobility index for the logged in user
$currentActivityIdx = null; // The current activity index for the logged in user. Not currently in use!

//$isFooterVisible = true;


/***************************
** General
***************************/

$(document).delegate('#mainPage', 'pageshow', function () {
	/************************************************************
	** Every time the main page is shown: reflow the charts
	** in case the window size has changed while on another page
	************************************************************/
	if (balanceChart != null) balanceChart.reflow();
	if (activityChart != null) activityChart.reflow();
});



$(document).ready(function() {

	showLoader(); // Displays the loading widget

	// Checks if the token and user data exist in localStorage
	if (localStorage.token && localStorage.userid && localStorage.firstname && localStorage.lastname && localStorage.email) {
		// Fetches token and data about the logged in user from localStorage
		token = localStorage.token;
		seniorUserID = localStorage.userid;
		seniorFirstName = localStorage.firstname;
		seniorLastName = localStorage.lastname;
		seniorEmail = localStorage.email;
	} else {
		// Redirect to login page
		window.location.replace("../index.html");
	}
	
	$("#messageWrapperAI").hide(); // Initially hides the box displaying AI feedback messages
	$("#messageWrapperBI").hide(); // Initially hides the box displaying BI feedback messages

	$("#userFullName").text(seniorFirstName + " " + seniorLastName); // Writes the full name of the logged in user to the DOM

	$.when($.ajax({
		/***************************
		** Timestamp of most recent update
		***************************/
		url: "http://vavit.no/adapt-staging/api/getNewestChangeTime.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
			request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
		},
		error: function(data, status) { // If the API request fails
			console.log("Error attempting to call API getNewestChangeTime.php with parameter seniorUserID=" + seniorUserID);
		}, 
		success: function(data, status) { // If the API request is successful
			if (data.data) {
				var updateTimeDiffText = getUpdateTimeDiff(new Date(data.data.timeCalculated)); // Calculates the string to display to tell how long ago the information was last updated
				$("#lastUpdatedValue").text(updateTimeDiffText); // Writes string to DOM
			} else {
				// No data registered for this user yet
				console.log(data.status_message);
			}
		}
	})).then(function(data, textStatus, jqXHR) {
		$.when($.ajax({
			/***************************
			** Newest mobility idx
			***************************/
			url: "http://vavit.no/adapt-staging/api/getNewestMobilityIdx.php?seniorUserID=" + seniorUserID,
			type: 'GET',
			beforeSend: function (request) {
				request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
			},
			error: function(data, status) { // If the API request fails
				console.log("Error attempting to call API getNewestMobilityIdx.php with parameter seniorUserID=" + seniorUserID);
			}, 
			success: function(data, status) { // If the API request is successful
				if (data.data) {
					//console.log("current MI stored!");
					$currentMobilityIdx = data.data.value;
					readCookieMIImg(); // Checks if a cookie is set for picking an MI img
				} else {
					// No MI registered for this user yet
					$("#MIImgHeader").html("<h3>Det er ikke registrert noen mobilitetsindeks ennå.</h3>"); // Writes to DOM
					$("#MIImgInnerWrapper").hide(); // Hides the MI image
				}
			}
		})).then(function(data, textStatus, jqXHR) {
			$.when($.ajax({
				/***************************
				** Balance chart
				***************************/
				url: "http://vavit.no/adapt-staging/api/getBalanceIdxs.php?seniorUserID=" + seniorUserID,
				type: 'GET',
				beforeSend: function (request) {
					request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
				},
				error: function(data, status) { // If the API request fails
					$("#balanceChartContainer").hide(); // Hide BI chart
					console.log("Error attempting to call API getBalanceIdxs.php with parameter seniorUserID=" + seniorUserID);
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
								var datePre = new Date(balanceChartDataJSON[i].timeDataCollected);
								datePre.setSeconds(datePre.getSeconds() - 1);
								dataPointPre.push(datePre.getTime());
								dataPointPre.push(parseFloat(balanceChartDataJSON[i-1].value));
								balanceChartData.push(dataPointPre);
							}

							
							var bi = parseFloat(balanceChartDataJSON[i].value);
							//if (bi > maxBI) maxBI = mi;

							var dataPoint = [];
							var date = Date.parse(balanceChartDataJSON[i].timeDataCollected);
							dataPoint.push(date);
							dataPoint.push(bi);
							balanceChartData.push(dataPoint);

							// If last data point from db, add a final data point at the current datetime
							if (i+1 == balanceChartDataJSON.length) {
								var dataPointFinal = [];
								dataPointFinal.push(new Date().getTime());
								dataPointFinal.push(parseFloat(balanceChartDataJSON[i].value));
								balanceChartData.push(dataPointFinal);
							}
						}

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
									pointWidth: 40
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
								/*color: {
									// Defines the color gradient of the chart.
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
								},*/
								lineWidth: 0,
								enableMouseTracking: false
							}]
						};

						// Finds the color to use in the top and middle of the chart based on the current MI.
						// todo: Need to iterate through all MI values and use the highest value to calculate color,
						// or define another correlastion between BI and MI.
						/*console.log("current MI: " + $currentMobilityIdx);
						colorMaxBI = getMIChartData($currentMobilityIdx).color;
						colorMidBI = getMIChartData($currentMobilityIdx/2).color;

						balanceChartOptions.series[0].color.stops[0][1] = "#" + colorMaxBI;
						balanceChartOptions.series[0].color.stops[1][1] = "#" + colorMidBI;
						console.log("ColorMax: " + colorMaxBI + ", colorMid: " + colorMidBI);*/

						balanceChartOptions.series[0].data = balanceChartData;

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
					url: "http://vavit.no/adapt-staging/api/getActivityIdxs.php?seniorUserID=" + seniorUserID,
					type: 'GET',
					beforeSend: function (request) {
						request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
					},
					error: function(data, status) { // If the API request fails
						$("#activityChartContainer").hide(); // Hide AI chart
						console.log("Error attempting to call API getActivityIdxs.php with parameter seniorUserID=" + seniorUserID);
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
							url: "http://vavit.no/adapt-staging/api/getFeedbackMsg.php?seniorUserID=" + seniorUserID 
								+ "&idx=" + firstFeedbackAjaxCall.idx + "&category=" + firstFeedbackAjaxCall.category,
							type: 'GET',
							beforeSend: function (request) {
								request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
							},
							error: function(data, status) { // If the API request fails
								console.log("Error attempting to call API getFeedbackMsg.php with parameters idx=" 
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
									url: "http://vavit.no/adapt-staging/api/getFeedbackMsg.php?seniorUserID=" + seniorUserID 
									+ "&idx=" + secondFeedbackAjaxCall.idx + "&category=" + secondFeedbackAjaxCall.category,
									type: 'GET',
									beforeSend: function (request) {
										request.setRequestHeader("Authorization", "Bearer " + token); // Sets the authorization header with the token
									},
									error: function(data, status) { // If the API request fails
										hideLoader(); // Hides the loading widget
										console.log("Error attempting to call API getFeedbackMsg.php with parameters idx=" 
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
	});

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
});


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
		$.mobile.changePage( "#mainPage", { transition: "flip"}); 
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

function getUpdateTimeDiff(timestamp) {
	// Calculates a string saying how long ago the given timestamp is from the current time.
	$updateTimeDiffText = "";
	now = convertDateToUTC(new Date());
	$milliDiff = now - timestamp;
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
	return $updateTimeDiffText;
}



/***************************
** Misc
***************************/
function logout() {
	// Removes localStorage values,
	// and redirects to the login page.
	localStorage.removeItem("firstname");
	localStorage.removeItem("lastname");
	localStorage.removeItem("userid");
	localStorage.removeItem("email");
	localStorage.removeItem("isexpert");
	localStorage.removeItem("token");

	window.location.replace("../index.html");
}


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