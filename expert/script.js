$activeUserData = null;
var chart;
var CSVFileAI = null;
var CSVFileBI = null;
var expertUserID;
var expertFirstName;
var expertLastName;
var expertEmail;
var token;

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

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
		if (birthMonth - 1 == todayMonth && todayDay < birthDay) age--;

		return age;	
	} else {
		return "";
	}
}

function updateDOM() {
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

		$fullAddress = "";
		if ($activeUserData["address"] != null) {
			$fullAddress += $activeUserData["address"];
		}
		if ($activeUserData["zipCode"] != null) {
			if ($fullAddress != "") {
				$fullAddress += ", ";
			}
			$fullAddress += $activeUserData["zipCode"];
		}
		if ($activeUserData["city"] != null) {
			if ($fullAddress != "") {
				$fullAddress += ", ";
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

$(document).bind("mobileinit", function(){
	$.mobile.defaultPageTransition = "slidefade";
});

$(document).ready(function() {

	if (localStorage.token) {
		token = localStorage.token;
	} else {
		window.location.replace("../index.html");
	}

	expertUserID = localStorage.userid;
	expertFirstName = localStorage.firstname;
	expertLastName = localStorage.lastname;
	expertEmail = localStorage.email;

	$('#newUserFormExpertUserID').val(expertUserID);

	$('#mobilityIdxDatePicker').val(new Date().toDateInputValue());

	getUserOverview();

	if(isAPIAvailable()) {
		$('#csvFileInputAI').bind('change', handleAIFileSelect);
		$('#csvFileInputBI').bind('change', handleBIFileSelect);
	}

	// Submit form for storing new mobility index
	$("#mobilityIdxForm").submit(function(e){

		$userIDValue = $("#mobilityIdxFormUserID").val();
		$mobilityIdxValue = $('#mobilityIdxInputField').val();

		if (parseFloat($mobilityIdxValue) != parseFloat($activeUserData["mobilityIdx"])) {
			if ($userIDValue != "") {
				if ($.isNumeric($mobilityIdxValue) && $mobilityIdxValue >= 0 && $mobilityIdxValue <= 1) {
					formData = $("#mobilityIdxForm").serialize();
					$.ajax({
						type: "POST",
						beforeSend: function (request) {
				            request.setRequestHeader("Authorization", "Bearer " + token);
				        },
						url: "http://vavit.no/adapt-staging/api/postMobilityIdx.php",
						/*contentType: "application/json; charset=utf-8",
					    dataType: "json",*/
						data: formData,
						success: function(data, status) {
							if (data.data) {
								showToast("#toastMobilityIdxForm", true, data.status_message);
							} else {
								showToast("#toastMobilityIdxForm", false, data.status_message);
							}

							$currentNewestMIDate = $activeUserData.mobilityIdxTimeDataCollected;
							$inputMIDate = $('#mobilityIdxDatePicker').val();

							if ($currentNewestMIDate == null || parseDate($inputMIDate) > parseDate($currentNewestMIDate)) {
								$("#cellMobilityIdx").html($mobilityIdxValue);
								$activeUserData['mobilityIdx'] = $mobilityIdxValue;
								$activeUserData['mobilityIdxTimeDataCollected'] = $inputMIDate;
							}
							
							getUserOverview();
							drawChart($userIDValue);
						},
						error: function(data, status) {
							showToast("#toastMobilityIdxForm", false, data.status_message);
						}
					});
				} else {
					showToast("#toastMobilityIdxForm", false, "Feil: ugyldig mobility index");
				}
			} else {
				showToast("#toastMobilityIdxForm", false, "Feil: finner ingen bruker-ID");
			}
		} else {
			showToast("#toastMobilityIdxForm", false, "Feil: Oppgitt mobility index er den samme som nåværende index.");
		}

		$('#mobilityIdxInputField').val("");

		return false;
	});

	// Submit form for storing new balance index
	$("#balanceIdxForm").submit(function(e){

		$balanceIdxValue = $('#balanceIdxInputField').val();

		formData = $("#balanceIdxForm").serialize();
		$.ajax({
			type: "POST",
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token);
	        },
			url: "http://vavit.no/adapt-staging/api/postBalanceIdx.php",
			/*contentType: "application/json; charset=utf-8",
		    dataType: "json",*/
			data: formData,
			success: function(data, status) {
				showToast("#toastBalanceIdxManualForm", true, data.status_message);
			},
			error: function(data, status) {
				showToast("#toastBalanceIdxManualForm", false, data.status_message);
			}
		});
		
		// Todo: update user detail table if newer than current
		//$("#cellBalanceIdx").html($balanceIdxValue);
		

		$('#balanceIdxDatePicker').val("");
		$('#balanceIdxInputField').val("");
		$('#balanceIdxInputField').focus();

		return false;
	});

	// Submit form for storing new activity index
	$("#activityIdxForm").submit(function(e){

		$activityIdxValue = $('#activityIdxInputField').val();

		formData = $("#activityIdxForm").serialize();
		$.ajax({
			type: "POST",
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token);
	        },
			url: "http://vavit.no/adapt-staging/api/postActivityIdx.php",
			/*contentType: "application/json; charset=utf-8",
		    dataType: "json",*/
			data: formData,
			success: function(data, status) {
				showToast("#toastActivityIdxManualForm", true, data.status_message);
			},
			error: function(data, status) {
				showToast("#toastActivityIdxManualForm", false, data.status_message);
			}
		});
		
		// Todo: update user detail table if newer than current
		//$("#cellActivityIdx").html($activityIdxValue);
		

		$('#activityIdxDatePicker').val("");
		$('#activityIdxInputField').val("");
		$('#activityIdxInputField').focus();

		return false;
	});


	// Submit form for storing new custom feedback message
	$("#registerFeedbackForm").submit(function(e){

		$feedbackText = $('#textarea-feedback').val();

		if ($feedbackText != null && $feedbackText != "") {
			formData = $("#registerFeedbackForm").serialize();
			$.ajax({
				type: "POST",
				beforeSend: function (request) {
		            request.setRequestHeader("Authorization", "Bearer " + token);
		        },
				url: "http://vavit.no/adapt-staging/api/postFeedbackMsgCustom.php",
				/*contentType: "application/json; charset=utf-8",
			    dataType: "json",*/
				data: formData,
				success: function(data, status) {
					showToast("#toastFeedbackForm", true, data.status_message);
				},
				error: function(data, status) {
					showToast("#toastFeedbackForm", false, data.status_message);
				}
			});
		} else {
			showToast("#toastFeedbackForm", false, "Feil: Du må skrive inn en tekst.");
		}

		$('#textarea-feedback').val("");

		return false;
	});

	// Submit form for updating user data
	$("#editUserDataForm").submit(function(e){
		
		formData = $("#editUserDataForm").serialize();
		$.ajax({
			type: "POST",
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token);
	        },
			url: "http://vavit.no/adapt-staging/api/putUserData.php",
			/*contentType: "application/json; charset=utf-8",
		    dataType: "json",*/
			data: formData,
			success: function(data, status) {
				if (data.data) {
					showToast("#toastEditUserDataForm", true, data.status_message);
				} else {
					showToast("#toastEditUserDataForm", false, data.status_message);
				}

				setActiveUser($activeUserData.userID,false);
				getUserOverview();
				updateDOM();
			},
			error: function(data, status) {
				showToast("#toastEditUserDataForm", false, data.status_message);
			}
		});

		return false;
	});


	// Submit form for adding new senior user
	$("#newUserForm").submit(function(e){
		
		formData = $("#newUserForm").serialize();
		$.ajax({
			type: "POST",
			beforeSend: function (request) {
	            request.setRequestHeader("Authorization", "Bearer " + token);
	        },
			url: "http://vavit.no/adapt-staging/api/postSeniorUser.php",
			/*contentType: "application/json; charset=utf-8",
		    dataType: "json",*/
			data: formData,
			success: function(data, status) {
				$.mobile.back();
				getUserOverview();
				clearNewUserForm();
			},
			error: function(data, status) {
				showToast("#toastNewUserForm", false, data.status_message);
			}
		});

		return false;
	});
});

function getUserOverview() {
	$.ajax({
		url: "http://vavit.no/adapt-staging/api/getSeniorUserOverview.php?expertUserID=" + expertUserID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		/*contentType: "application/json; charset=utf-8",
	    dataType: "json",*/
		error : function(data, status) {
			console.log("Error fetching data from API getSeniorUserOverview.");
		},
		success: function(data, status) {
			var userData = data.data;

			if (userData != null) {
				$('#usersTable tbody tr').remove();
				var html = '';

				for (var i=0; i<userData.length; i++) {
					$mobilityIdx = userData[i].mobilityIdx;
					if ($mobilityIdx == null) {
						$mobilityIdx = "";
					}
					$age = calculateAge(userData[i].birthDate);

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

function getNewestMobilityIdx(userID) {
	$.ajax({
		url: "http://vavit.no/adapt-staging/api/getNewestMobilityIdx.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		/*contentType: "application/json; charset=utf-8",
	    dataType: "json",*/
		error : function(data, status) {
			console.log("Error fetching data from API getNewestMobilityIdx.");
			return null;
		},
		success: function(data, status) {
			if (data.data) {
				return data.data.value;
				console.log("successfully fetched MI for userID=" + userID + ". Data=" + data.data.value);
			} else {
				return null;
			}
		}
	});
}

function setActiveUser(userID, changePage) {
	clearUserDetailsTable();
	clearEditUserForm();

	if (changePage) {
		$.mobile.changePage("index.html#user-detail-page");
	}

	$.ajax({
		url: "http://vavit.no/adapt-staging/api/getSeniorUserDetails.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		/*contentType: "application/json; charset=utf-8",
	    dataType: "json",*/
		error : function(data, status) {
			console.log("Error getting the user details. Msg from API: " + status);
		}, 
		success: function(data, status) {
			$activeUserData = data.data[0];
			updateDOM();

			$('#mobilityIdxFormUserID').val(userID);
			$('#activityIdxFormUserID').val(userID);
			$('#balanceIdxFormUserID').val(userID);
			$('#editUserDataFormUserID').val(userID);
			$('#registerFeedbackFormUserID').val(userID);

			if ($activeUserData.mobilityIdx != null) {
				drawChart(userID);
			} else {
				$("#chartContainer").hide();
			}
		}
	});
}

function deleteUser() {
	userID = $activeUserData.userID;
	$.ajax({
		url: "http://vavit.no/adapt-staging/api/putSeniorUserInactive.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		/*contentType: "application/json; charset=utf-8",
	    dataType: "json",*/
		error : function(data, status) { }, 
		success: function(data, status) {
			$('table tr').each(function(){
				if ($(this).find('td').eq(0).text() == userID){
					$(this).remove();
				}
			});

			getUserOverview();

			$.mobile.back();
		}
	});
}

/***************************
** Chart
***************************/
function drawChart(userID) {
    chartOptions = {
        chart: {
            renderTo: 'chart',
            type: 'area',
            zoomType: 'x',
            backgroundColor: null,
            reflow: true
        },
        title: {
            text: 'Endring i mobility idx over tid'
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
            max: 1,
            min: 0,
            alternateGridColor: '#DEE0E3',
            tickInterval: 0.1
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        tooltip: {
            //enabled: false
        },
        series: [{}]
    };


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


    $.ajax({
		url: "http://vavit.no/adapt-staging/api/getMobilityIdxs.php?seniorUserID=" + userID,
		type: 'GET',
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		error : function(data, status) {
			console.log("Error attempting to call API getMobilityIdxs.php with parameter seniorUserID=" + userID);
		}, 
		success: function(data, status) {
			var chartDataJSON = data.data;

	        if (data.data != null) {
		    	var chartData = [];
		        for (var i=0; i<chartDataJSON.length; i++) {
		            if (i != 0) {
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

		        chartOptions.series[0].data = chartData;

		        chart = new Highcharts.Chart(chartOptions);
		        $("#chartContainer").show();
	        } else {
	        	console.log("No mobility idx values found in db.");
	        }
		}
	});
}


$(document).delegate('#user-detail-page', 'pageshow', function () {
    if ($activeUserData != null && $activeUserData.mobilityIdx != "" && chart != null) {
    	chart.reflow();
    }
});



function logout() {
	localStorage.removeItem("firstname");
	localStorage.removeItem("lastname");
	localStorage.removeItem("userid");
	localStorage.removeItem("email");
	localStorage.removeItem("isexpert");
	localStorage.removeItem("token");

	window.location.replace("../index.html");
}

function isAPIAvailable() {
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



/***************************
** CSV file upload
***************************/

function handleAIFileSelect(evt) {
	var files = evt.target.files; // FileList object
	CSVFileAI = files[0];
}

function handleBIFileSelect(evt) {
	var files = evt.target.files; // FileList object
	CSVFileBI = files[0];
}

function readCSVFile(isAI) {
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
		var data = $.csv.toObjects(csv);

		var validData = [];

		// Remove empty lines and other invalid entries
		for(var i=0; i<data.length; i++) {
			if ((typeof data[i].dato != 'undefined') && (data[i].dato != null) && (data[i].dato != '')) {
				validData.push(data[i]);
			}
		}

		var numEntries = validData.length;
			
		callAjaxPostAcitivtyIdx(validData, 0, 0, 0, isAI);

	};
	reader.onerror = function(){ alert('Kunne ikke lese filen ' + file.fileName); };

}

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
	
	var formData = "userID=" + $activeUserData.userID + "&timeDataCollected=" + dateSplit[2] + "-" + dateSplit[1] + "-" + dateSplit[0] + "&" + valueFieldName + "=" + inputData[idx].ai;
	
	$.when($.ajax({
		type: "POST",
		beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + token);
        },
		url: apiUrl,
		data: formData,
		success: function(data, status) {
			successCounter++;
		},
		error: function(data, status) {
			errorCounter++;
		}
	})).then(function(data, textStatus, jqXHR) {
		var nextIdx = idx + 1;
		if (nextIdx == inputData.length) {
			showNotificationActivityIdxFileUpload(successCounter, errorCounter, isAI);
		} else {
			callAjaxPostAcitivtyIdx(inputData, nextIdx, successCounter, errorCounter, isAI);
		}
	});
}

function showNotificationActivityIdxFileUpload(successCounter, errorCounter, isAI) {
	var toastID = null;
	if (isAI) {
		toastID = "#toastActivityIdxFileUpload";
	} else {
		toastID = "#toastBalanceIdxFileUpload";
	}

	if (errorCounter > 0) {
		var total = errorCounter + successCounter;
		var plural = (total > 1) ? "er" : "";
		var errorMsg = errorCounter + " av " + total + " oppføring" + plural + " ble IKKE lagret i databasen.";
		showToast(toastID, false, errorMsg);
	} else {
		var plural = (successCounter > 1) ? "er" : "";
		var successMsg = successCounter + " oppføring" + plural + " ble lagret i databasen.";
		showToast(toastID, true, successMsg);
	}
}


function showToast(formID, success, msg) {
	if (success) {
		$(formID).removeClass("toast-error").addClass("toast-success");
		$(formID + 'Img').attr("src","img/check.png");
		if (!msg) msg = "Suksess!";
	} else {
		$(formID).removeClass("toast-success").addClass("toast-error");
		$(formID + 'Img').attr("src","img/error.png");
		if (!msg) msg = "Det har oppstått en feil.";
	}

	$(formID + 'Text').text($.trim(msg));
	$(formID).stop().fadeIn(400).delay(3000).fadeOut(400); //fade out after 3 seconds
}



function parseDate(input) {
  var parts = input.split('-');
  // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
  return new Date(parts[0], parts[1]-1, parts[2]); // Note: months are 0-based
}


/* Clear HTML */

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