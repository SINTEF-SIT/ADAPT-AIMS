$activeUserData = null;
var chart;


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

		$("#cellAddress").html($activeUserData["address"] + ", " + $activeUserData["zipCode"] + " " + $activeUserData["city"]);
		$("#cellPhoneNr").html($activeUserData["phoneNumber"]);
		$("#cellDateJoined").html($activeUserData["dateJoinedAdapt"]);
		$("#cellGender").html($genderStr);
		$("#cellWeight").html($activeUserData["weight"] + " kg");
		$("#cellHeight").html($activeUserData["height"] + " cm");
		//$("#cellFalls6").html($activeUserData["numFalls6Mths"]);
		//$("#cellFall12").html($activeUserData["numFalls12Mths"]);
		$("#cellWalkingAid").html($usesWalkingAidStr);
		$("#cellLivingIndependently").html($livingIndependentlyStr);


		/******** Update edit user data form ********/

		$("#inputFieldEditFirstName").val($activeUserData["firstName"]);
		$("#inputFieldEditLastName").val($activeUserData["lastName"]);
		$("#inputFieldEditAddress").val($activeUserData["address"]);
		$("#inputFieldEditZipCode").val($activeUserData["zipCode"]);
		$("#inputFieldEditCity").val($activeUserData["city"]);
		$("#inputFieldEditPhone").val($activeUserData["phoneNumber"]);
		$("#inputFieldEditWeight").val($activeUserData["weight"]);
		$("#inputFieldEditHeight").val($activeUserData["height"]);
		//$("#inputFieldEditNumFalls6Mths").val($activeUserData["numFalls6Mths"]);
		//$("#inputFieldEditNumFalls12Mths").val($activeUserData["numFalls12Mths"]);
		$("#inputFieldEditUsesWalkingAid").prop('checked', $usesWalkingAidBool);
		$("#inputFieldEditLivingIndependently").prop('checked', $livingIndependentlyBool);
	}
}

$(document).ready(function() {

	$("#notificationEditUserDataForm").hide();
	$("notificationMobilityIdxForm").hide();
	$("notificationFeedbackForm").hide();

	// Submit form for storing new mobility index
	$("#mobilityIdxForm").submit(function(e){

		$userIDValue = $("#mobilityIdxFormUserID").val();
		$mobilityIdxValue = $('#mobilityIdxInputField').val();

		if ($mobilityIdxValue != $activeUserData["mobilityIdx"]) {
			if ($userIDValue != "") {
				if ($.isNumeric($mobilityIdxValue) && $mobilityIdxValue > 0 && $mobilityIdxValue < 6) {
					formData = $("#mobilityIdxForm").serialize();
					$.ajax({
						type: "POST",
						url: "http://vavit.no/adapt-staging/api/postMobilityIdx.php",
						cache: false,
						data: formData,
						success: function(data, status) {
							$("#notificationMobilityIdxForm").text($.trim(data.status_message));
						},
						error: function(data, status) { }
					});
					$("#cellMobilityIdx").html($mobilityIdxValue);
					$activeUserData['mobilityIdx'] = $mobilityIdxValue;
				} else {
					$("#notificationMobilityIdxForm").text("Feil: ugyldig mobility index");
				}
			} else {
				$("#notificationMobilityIdxForm").text("Feil: finner ingen bruker-ID");
			}
		} else {
			$("#notificationMobilityIdxForm").text("Feil: Oppgitt mobility index er den samme som nåværende index.");
		}

		$('#mobilityIdxInputField').val("");

		$("#notificationMobilityIdxForm").fadeIn("slow", function() {
			// Animation complete
		});

		setTimeout(function() {
			$("#notificationMobilityIdxForm").fadeOut("slow", function() {
				$("#notificationMobilityIdxForm").text("");
			});
		}, 5000);

		return false;
	});


	// Submit form for storing new mobility index
	$("#registerFeedbackForm").submit(function(e){

		$feedbackText = $('#textarea-feedback').val();

		if ($feedbackText != null && $feedbackText != "") {
			formData = $("#registerFeedbackForm").serialize();
			$.ajax({
				type: "POST",
				url: "http://vavit.no/adapt-staging/api/postFeedbackMsgCustom.php",
				cache: false,
				data: formData,
				success: function(data, status) {
					$("#notificationFeedbackForm").text($.trim(data.status_message));
				},
				error: function(data, status) {
					$("#notificationFeedbackForm").text("Det oppstod en feil.");
				}
			});
		} else {
			$("#notificationFeedbackForm").text("Feil: Du må skrive inn en tekst.");
		}

		$('#textarea-feedback').val("");

		$("#notificationFeedbackForm").fadeIn("slow", function() {
			// Animation complete
		});

		setTimeout(function() {
			$("#notificationFeedbackForm").fadeOut("slow", function() {
				$("#notificationFeedbackForm").text("");
			});
		}, 5000);

		return false;
	});

	// Submit form for updating user data
	$("#editUserDataForm").submit(function(e){
		
		formData = $("#editUserDataForm").serialize();
		$.ajax({
			type: "POST",
			url: "http://vavit.no/adapt-staging/api/putUserData.php",
			cache: false,
			data: formData,
			success: function(data, status) {
				$("#notificationEditUserDataForm").text($.trim(data.status_message));
				updateDOM();
				setActiveUser($activeUserData.userID,false);
			},
			error: function(data, status) { }
		});

		$("#notificationEditUserDataForm").fadeIn("slow", function() {
			// Animation complete
		});

		setTimeout(function() {
			$("#notificationEditUserDataForm").fadeOut("slow", function() {
				$("#notificationEditUserDataForm").text("");
			});
		}, 5000);

		return false;
	});


	// Submit form for adding new senior user
	$("#newUserForm").submit(function(e){
		
		formData = $("#newUserForm").serialize();
		console.log(formData);
		$.ajax({
			type: "POST",
			url: "http://vavit.no/adapt-staging/api/postSeniorUser.php",
			cache: false,
			data: formData,
			success: function(data, status) {
				$.mobile.back();
				console.log(data.status_message);
				// todo: add new user to main table
			},
			error: function(data, status) {
				console.log("ERROR: " + data.status_message);
			}
		});

		$("#notificationEditUserDataForm").fadeIn("slow", function() {
			// Animation complete
		});

		setTimeout(function() {
			$("#notificationEditUserDataForm").fadeOut("slow", function() {
				$("#notificationEditUserDataForm").text("");
			});
		}, 5000);

		return false;
	});
});

function setActiveUser(userID, changePage) {
	if (changePage) {
		$.mobile.changePage("index.php#user-detail-page");
	}

	$url = "http://vavit.no/adapt-staging/api/getSeniorUserDetails.php?seniorUserID=" + userID;
	$.ajax({
		url: $url,
		type: 'GET',
		error : function(data, status) { }, 
		success: function(data, status) {
			$activeUserData = data.data[0];
			updateDOM();

			$('#mobilityIdxFormUserID').val(userID);
			$('#editUserDataFormUserID').val(userID);
			$('#registerFeedbackFormUserID').val(userID);

			drawChart(userID);
		}
	});
}

function deleteUser() {
	userID = $activeUserData.userID;
	$url = "http://vavit.no/adapt-staging/api/putSeniorUserInactive.php?seniorUserID=" + userID;
	$.ajax({
		url: $url,
		type: 'GET',
		error : function(data, status) { }, 
		success: function(data, status) {
			$('table tr').each(function(){
				if ($(this).find('td').eq(0).text() == userID){
					$(this).remove();
				}
			});

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
            max: 5,
            min: 1,
            alternateGridColor: '#DEE0E3',
            tickInterval: 1
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


    var chartDataURL = "http://vavit.no/adapt-staging/api/getMobilityIdxs.php?seniorUserID=" + userID;
    $.getJSON(chartDataURL, function(data) {

        var chartDataJSON = data.data;
        var chartData = [];
        for (var i=0; i<chartDataJSON.length; i++) {
            if (i != 0) {
                var dataPointPre = [];
                var datePre = new Date(chartDataJSON[i].timeDataCollected);
                datePre.setSeconds(datePre.getSeconds() - 1);
                dataPointPre.push(datePre.getTime());
                dataPointPre.push(chartDataJSON[i-1].value);
                chartData.push(dataPointPre);
            }

            var dataPoint = [];
            var date = Date.parse(chartDataJSON[i].timeDataCollected);
            dataPoint.push(date);
            dataPoint.push(chartDataJSON[i].value);
            chartData.push(dataPoint);

            // If last data point from db, add a final data point at the current datetime
            if (i+1 == chartDataJSON.length) {
                var dataPointFinal = [];
                dataPointFinal.push(new Date().getTime());
                dataPointFinal.push(chartDataJSON[i].value);
                chartData.push(dataPointFinal);
            }
        }

        chartOptions.series[0].data = chartData;

        chart = new Highcharts.Chart(chartOptions);
    });
}


$(document).delegate('#user-detail-page', 'pageshow', function () {
    chart.reflow();
});



function logout() {
	window.location.replace("http://vavit.no/adapt-staging/logout.php");
}