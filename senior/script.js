/***************************
** Global variables
***************************/
var changesMade = 0;
var chart;
var MIImgID;
var oldMIImgID;
//var chartData;

$mobilityIdxs = null;
$currentMobilityIdx = null;

/***************************
** General
***************************/
$(document).ready(function() {

    $("#userFullName").text(firstName + " " + lastName);

    $url = "http://vavit.no/adapt-staging/api/getNewestMobilityIdx.php?seniorUserID=" + userID;
    $.ajax({
        url: $url,
        type: 'GET',
        error : function(data, status) {
            console.log("Error attempting to call API getNewestMobilityIdx.php with parameter seniorUserID=" + userID);
        }, 
        success: function(data, status) {
            $currentMobilityIdx = data.data.value;
            $updateTimeDiffText = getUpdateTimeDiff(new Date(data.data.timeDataCollected));
            $("#lastUpdatedValue").text($updateTimeDiffText);

            readCookieMIImg();
            drawChart();
        }
    });
});


/***************************
** Chart
***************************/
function drawChart() {
    chartOptions = {
        chart: {
            renderTo: 'chart',
            type: 'area',
            //zoomType: 'x',
            backgroundColor: null,
            reflow: true
        },
        title: {
            text: 'Din mobilitetsindeks over tid'
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
            enabled: false
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
document.getElementById("MIImgSelectionGroup").addEventListener("click", function(e) {
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
}, false);

function setMMImg() {
    var imgPath = "img/MIImg/" + $currentMobilityIdx + "/" + MIImgID + ".png";
    var img = document.getElementById("MIImg");
    img.src = imgPath;
    setCorrectBorder();
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
    window.location.replace("http://vavit.no/adapt-staging/logout.php");
}