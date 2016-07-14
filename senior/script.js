/***************************
** Global variables
***************************/
var changesMade = 0;
var balanceChart;
var activityChart;
var MIImgID;
var oldMIImgID;
//var chartData;
var seniorUserID;
var token;
var seniorEmail;
var seniorFirstName;
var seniorLastName;

$mobilityIdxs = null;
$currentMobilityIdx = null;
$currentActivityIdx = null;

/***************************
** General
***************************/
$(document).ready(function() {
	showLoader();

	if (localStorage.token) {
		token = localStorage.token;
	} else {
		window.location.replace("../index.html");
	}

	seniorUserID = localStorage.userid;
	seniorFirstName = localStorage.firstname;
	seniorLastName = localStorage.lastname;
	seniorEmail = localStorage.email;
	
	$("#messageWrapper").hide();

	$("#userFullName").text(seniorFirstName + " " + seniorLastName);

	$.when($.ajax({
		url: "http://vavit.no/adapt-staging/api/getNewestMobilityIdx.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		error : function(data, status) {
			console.log("Error attempting to call API getNewestMobilityIdx.php with parameter seniorUserID=" + seniorUserID);
		}, 
		success: function(data, status) {
			if (data.data) {
				$currentMobilityIdx = data.data.value;
				$currentMobilityIdxRounded = Math.round($currentMobilityIdx * 10) / 10;
				$updateTimeDiffText = getUpdateTimeDiff(new Date(data.data.timeDataCollected));
				$("#lastUpdatedValue").text($updateTimeDiffText);

				readCookieMIImg();
				drawBalanceChart();
			} else {
				$("#MIImgHeader").html("<h3>Det er ikke registrert noen mobilitetsindeks ennå.</h3>");
				$("#MIImgInnerWrapper").hide();
				$("#balanceChartContainer").hide();
				$("#messageWrapper").hide();
			}
		}
	}), $.ajax({
		url: "http://vavit.no/adapt-staging/api/getNewestActivityIdx.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		error : function(data, status) {
			console.log("Error attempting to call API getNewestActivityIdx.php with parameter seniorUserID=" + seniorUserID);
		}, 
		success: function(data, status) {
			if (data.data) {
				$currentActivityIdx = data.data.value;
				drawActivityChart();
			} else {
				$("#activityChartContainer").hide();
				//$("#activityChart").html("<h3>Det er ikke registrert noen aktivitetsdata ennå.</h3>");
			}
		}
	}), $.ajax({
		url: "http://vavit.no/adapt-staging/api/getFeedbackMsg.php?seniorUserID=" + seniorUserID + "&category=0", // Get newest AI feedback msg
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		error : function(data, status) {
			console.log("Error attempting to call API getFeedbackMsg.php with parameters seniorUserID=" + seniorUserID + " and category=0");
		}, 
		success: function(data, status) {
			if (data.data) {
				$("#feedbackMsg").html("<b>Aktivitetsråd:</b> " + data.data.feedbackText);
				$("#messageWrapper").show();
			} else {
				console.log(data.status_message);
			}
		}
	})).then(function(data, textStatus, jqXHR) {
		$.ajax({
			url: "http://vavit.no/adapt-staging/api/getFeedbackMsg.php?seniorUserID=" + seniorUserID + "&category=1", // Get newest BI feedback msg
			type: 'GET',
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token);
	        },
			error : function(data, status) {
				hideLoader();
				console.log("Error attempting to call API getFeedbackMsg.php with parameters seniorUserID=" + seniorUserID + " and category=1");
			}, 
			success: function(data, status) {
				hideLoader();
				if (data.data) {
					var newline = "";
					if ($("#feedbackMsg").html() != "") {
						newline = "<br>";
					}
					$("#feedbackMsg").append(newline + "<b>Balanseråd:</b> " + data.data.feedbackText);
					$("#messageWrapper").show();
				} else {
					console.log(data.status_message);
				}
			}
		});

		/*if ($currentMobilityIdx && $currentActivityIdx) {
			$.ajax({
				url: 'http://vavit.no/adapt-staging/api/getFeedbackMsg.php?mi=' + $currentMobilityIdx + '&ai=' + $currentActivityIdx,
				type: 'GET',
				beforeSend: function (request) {
	                request.setRequestHeader("Authorization", "Bearer " + token);
	            },
				error : function(data, status) {
					hideLoader();
					console.log("Error attempting to call API getFeedbackMsg.php with parameters mi=" + $currentMobilityIdx + ", ai=" + $currentActivityIdx);
				}, 
				success: function(data, status) {
					hideLoader();
					if (data.data) {
						$("#feedbackMsg").html(data.data.feedbackText);
						$("#messageWrapper").show();
					} else {
						console.log(data.status_message);
					}
				}
			});
		}*/
	});

	Highcharts.setOptions({
		lang: {
			months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni',  'juli', 'august', 'september', 'oktober', 'november', 'desember'],
			shortMonths: ['jan', 'feb', 'mars', 'apr', 'mai', 'juni',  'juli', 'aug', 'sep', 'okt', 'nov', 'des'],
			weekdays: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
			shortWeekdays: ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø']
		},
		global: {
			getTimezoneOffset: function (timestamp) {
				var zone = 'Europe/Oslo',
					timezoneOffset = -moment.tz(timestamp, zone).utcOffset();

				return timezoneOffset;
			}
		}
	});
});


/***************************
** Balance chart
***************************/
function drawBalanceChart() {
	balanceChartOptions = {
		chart: {
			renderTo: 'balanceChart',
			type: 'area',
			//zoomType: 'x',
			backgroundColor: null,
			reflow: true
		},
		title: {
			text: 'Din balanse'
		},
		xAxis: {
			type: 'datetime',
			tickInterval: 24 * 3600 * 1000
		},
		yAxis: {
			title: {
				//text: 'Mobilitetsindeks'
				enabled: false
			},
			//max: 1,
			min: 0,
            endOnTick: false,
			alternateGridColor: '#DEE0E3',
			tickInterval: 0.1
		},
		plotOptions: {
			series: {
	            pointWidth: 40
	        }
		},
		legend: {
			enabled: false
		},
		credits: {
			enabled: false
		},
		tooltip: {
			enabled: false
		},
		series: [{
			color: {
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
            enableMouseTracking: false
		}]
	};

	$.ajax({
		url: "http://vavit.no/adapt-staging/api/getBalanceIdxs.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		error : function(data, status) {
			console.log("Error attempting to call API getBalanceIdxs.php with parameter seniorUserID=" + seniorUserID);
		}, 
		success: function(data, status) {
			var balanceChartDataJSON = data.data;
			var balanceChartData = [];

			if (balanceChartDataJSON != null) {
				var maxMI = 0;
				for (var i=0; i<balanceChartDataJSON.length; i++) {
					if (i != 0) {
						var dataPointPre = [];
						var datePre = new Date(balanceChartDataJSON[i].timeDataCollected);
						datePre.setSeconds(datePre.getSeconds() - 1);
						dataPointPre.push(datePre.getTime());
						dataPointPre.push(parseFloat(balanceChartDataJSON[i-1].value));
						balanceChartData.push(dataPointPre);
					}

					var mi = parseFloat(balanceChartDataJSON[i].value);
					if (mi > maxMI) maxMI = mi;

					var dataPoint = [];
					var date = Date.parse(balanceChartDataJSON[i].timeDataCollected);
					dataPoint.push(date);
					dataPoint.push(mi);
					balanceChartData.push(dataPoint);

					// If last data point from db, add a final data point at the current datetime
					if (i+1 == balanceChartDataJSON.length) {
						var dataPointFinal = [];
						dataPointFinal.push(new Date().getTime());
						dataPointFinal.push(parseFloat(balanceChartDataJSON[i].value));
						balanceChartData.push(dataPointFinal);
					}
				}

				colorMaxMI = getMIChartData($currentMobilityIdx).color; // todo: define correlation between BI and MI
				colorMidMI = getMIChartData($currentMobilityIdx/2).color;

				balanceChartOptions.series[0].color.stops[0][1] = "#" + colorMaxMI;
				balanceChartOptions.series[0].color.stops[1][1] = "#" + colorMidMI;

				balanceChartOptions.series[0].data = balanceChartData;

				balanceChart = new Highcharts.Chart(balanceChartOptions);
			} else {
				$("#balanceChartContainer").hide();
				//$("#balanceChart").html("<h3>Det er ikke registrert noen data om din balanse ennå.</h3>");
			}
		}
	});
}



/***************************
** Activity chart
***************************/
function drawActivityChart() {
	activityChartOptions = {
		chart: {
			renderTo: 'activityChart',
			type: 'column',
			//zoomType: 'x',
			backgroundColor: null,
			reflow: true
		},
		title: {
			text: 'Din fysiske aktivitet'
		},
		xAxis: {
			type: 'datetime',
			tickInterval: 24 * 3600 * 1000
		},
		yAxis: {
			title: {
				//text: 'Mobilitetsindeks'
				enabled: false
			},
			max: 5,
			min: 0,
			alternateGridColor: '#DEE0E3',
			tickInterval: 1
		},
		plotOptions: {
			series: {
				pointWidth: 20
			}
		},
		legend: {
			enabled: false
		},
		credits: {
			enabled: false
		},
		tooltip: {
			enabled: false
		},
		series: [{}]
	};


	$.ajax({
		url: "http://vavit.no/adapt-staging/api/getActivityIdxs.php?seniorUserID=" + seniorUserID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		error : function(data, status) {
			console.log("Error attempting to call API getActivityIdxs.php with parameter seniorUserID=" + seniorUserID);
		}, 
		success: function(data, status) {
			var activityChartDataJSON = data.data;
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

			activityChartOptions.series[0].data = activityChartData;

			activityChart = new Highcharts.Chart(activityChartOptions);
		}
	});
} 



/***************************
** Cookies
***************************/
function readCookieMIImg() {
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
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
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
					changesMade = 0;
					showSaveAndCancelBtns(0);
				} else {
					changesMade = 1;
					showSaveAndCancelBtns(1);
				}

				MIImgID = clickedID;
				setMMImg();
			}
	}
	e.stopPropagation();
}, false);*/

function setMMImg() {
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
	var backBtn = document.getElementById("backBtn");
	var saveBtn = document.getElementById("saveBtn");
	var cancelBtn = document.getElementById("cancelBtn");

	if (show == 1) {
		backBtn.style.display = "none";
		saveBtn.style.display = "block";
		cancelBtn.style.display = "block";
	} else {
		backBtn.style.display = "block";
		saveBtn.style.display = "none";
		cancelBtn.style.display = "none";
	}
}

function saveChanges() {
	oldMIImgID = MIImgID;
	closeSettingsView();
}

function cancelChanges() {
	MIImgID = oldMIImgID;
	setMMImg();
	closeSettingsView();
	setTimeout(function () { 
		$.mobile.changePage( "#mainPage", { transition: "flip"}); 
	}, 1);
}

function closeSettingsView() {
	showSaveAndCancelBtns(0);
	changesMade = 0;
	setCookie("MIImgID", MIImgID, 7);

	// Need to run reflow function in case the window has resized while in settings view
	setTimeout(function () { 
		chart.reflow();
	}, 500);
}


/***************************
** Time calculation
***************************/
function convertDateToUTC(date) { 
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); 
}

function getUpdateTimeDiff(timeDataCollected) {
	$updateTimeDiffText = "";
	now = convertDateToUTC(new Date());
	$milliDiff = now - timeDataCollected;
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
	localStorage.removeItem("firstname");
	localStorage.removeItem("lastname");
	localStorage.removeItem("userid");
	localStorage.removeItem("email");
	localStorage.removeItem("isexpert");
	localStorage.removeItem("token");

	window.location.replace("../index.html");
}

function getMIChartData($mi) {
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


function getColorBetween(color1, color2) {
	var ratio = 0.5;

	var hex = function(x) {
	    x = x.toString(16);
	    return (x.length == 1) ? '0' + x : x;
	};

	var r = Math.ceil(parseInt(color1.substring(0,2), 16) * ratio + parseInt(color2.substring(0,2), 16) * (1-ratio));
	var g = Math.ceil(parseInt(color1.substring(2,4), 16) * ratio + parseInt(color2.substring(2,4), 16) * (1-ratio));
	var b = Math.ceil(parseInt(color1.substring(4,6), 16) * ratio + parseInt(color2.substring(4,6), 16) * (1-ratio));

	return hex(r) + hex(g) + hex(b);
}


function showLoader() {
	$.mobile.loading( "show", {
		text: '',
		textVisible: false,
		theme: 'a',
		textonly: false,
		html: ''
    });
}

function hideLoader() {
	$.mobile.loading( "hide" );
}