//********************************************************************
//                   Draws the balance idx chart
//********************************************************************
function drawBIChart(startTime, endTime) {
	if (activeUser.balanceIndexes !== null) {
		var balanceChartData = [];

		for (var i=0; i<activeUser.balanceIndexes.length; i++) {
			// Comment out if chart is changed to a column chart!
			if (i != 0) {
				// Draws an extra data point right before each data point (except the first) 
				// to get a flat line instead of a straight, diagonal line between the points.
				// Needs to be commented out if the chart is switched to a column chart.
				var dataPointPre = [];
				var datePre = moment.tz(activeUser.balanceIndexes[i].dateFrom, "UTC");
				datePre.seconds(-1);
				dataPointPre.push(datePre.valueOf());
				dataPointPre.push(parseFloat(activeUser.balanceIndexes[i-1].value));
				balanceChartData.push(dataPointPre);
			}

			var bi = parseFloat(activeUser.balanceIndexes[i].value);

			var dataPoint = [];
			var date = moment.tz(activeUser.balanceIndexes[i].dateFrom, "UTC");
			dataPoint.push(date.valueOf());
			dataPoint.push(bi);
			balanceChartData.push(dataPoint);

			// Comment out if chart is changed to a column chart!
			// If last data point from db, add a final data point using the last dateTo value
			if (i+1 == activeUser.balanceIndexes.length) {
				var dataPointFinal = [];
				var dateFinal = moment.tz(activeUser.balanceIndexes[i].dateTo, "UTC");
				dataPointFinal.push(dateFinal.valueOf());
				dataPointFinal.push(bi);
				balanceChartData.push(dataPointFinal);

				activeUser.userData.balanceIdx = bi;
			}
		}

		if (startTime === null) {
			startTime = balanceChartData[0][0];
		}
		if (endTime === null) {
			endTIme = balanceChartData[balanceChartData.length-1][0];
		}

		balanceChartOptions = {
			chart: {
				renderTo: 'balanceChart', // ID of div where the chart is to be rendered
				type: 'area', // Chart type. Can e.g. be set to 'column' or 'area'
				zoomType: 'x', // The chart is zoomable along the x-axis by clicking and draging over a portion of the chart
				backgroundColor: null,
				reflow: true
			},
			title: {
				text: 'Balance index'
			},
			xAxis: {
				type: 'datetime',
				min: startTime,
				max: endTime,
				minTickInterval: 24 * 3600 * 1000
			},
			yAxis: {
				title: {
					enabled: false
				},
				max: 1, // The ceiling value of the y-axis
				min: -1, // The floor of the y-axis
				endOnTick: false,
				alternateGridColor: '#DEE0E3',
				tickInterval: 0.1, // How frequent a tick is displayed on the axis
				plotLines: [{
					color: 'black', // Color value
					dashStyle: 'ShortDash', // Style of the plot line. Default to solid
					value: 0, // Value of where the line will appear
					width: 2, // Width of the line
					label: { 
						text: 'Normalverdi', // Content of the label. 
						align: 'left'
					}
				}]
			},
			legend: {
				enabled: false // Hides the legend showing the name and toggle option for the series
			},
			credits: {
				enabled: false // Hides the Highcharts credits
			},
			series: [{
				threshold: -1,
				data: balanceChartData
			}]
		};

		$("#balanceChartContainer").show();
		balanceChart = new Highcharts.Chart(balanceChartOptions);
	}
}


//********************************************************************
//                   Draws the activity idx chart
//********************************************************************
function drawAIChart(startTime, endTime) {
	if (activeUser.activityIndexes !== null) {
		var activityChartData = [];
		for (var i=0; i<activeUser.activityIndexes.length; i++) {
			if (i !== 0) {
				// Draws an extra data point right before each data point (except the first) 
				// to get a flat line instead of a straight, diagonal line between the points.
				// Needs to be commented out if the chart is switched to a column chart.
				var dataPointPre = [];
				var datePre = moment.tz(activeUser.activityIndexes[i].dateFrom, "UTC");
				datePre.seconds(-1);
				dataPointPre.push(datePre.valueOf());
				dataPointPre.push(parseFloat(activeUser.activityIndexes[i-1].value));
				activityChartData.push(dataPointPre);
			}


			var dataPoint = [];
			var date = moment.tz(activeUser.activityIndexes[i].dateFrom, "UTC");
			dataPoint.push(date.valueOf());
			dataPoint.push(activeUser.activityIndexes[i].value);
			activityChartData.push(dataPoint);

			// If last data point from db, add the dateTo value as the final data point.
			if (i+1 === activeUser.activityIndexes.length) {
				var dataPointFinal = [];
				var dateFinal = moment.tz(activeUser.activityIndexes[i].dateTo, "UTC");
				dataPointFinal.push(dateFinal.valueOf());
				dataPointFinal.push(activeUser.activityIndexes[i].value);
				activityChartData.push(dataPointFinal);
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
				zoomType: 'x', // The chart is zoomable along the x-axis by clicking and draging over a portion of the chart
				backgroundColor: null,
				reflow: true
			},
			title: {
				text: 'Activity index'
			},
			xAxis: {
				type: 'datetime',
				min: startTime,
				max: endTime,
				minTickInterval: 24 * 3600 * 1000
			},
			yAxis: {
				title: {
					enabled: false
				},
				max: 168, // The ceiling value of the y-axis
				min: 0, // The floor of the y-axis
				alternateGridColor: '#DEE0E3',
				tickInterval: 1, // How frequent a tick is displayed on the axis
				plotLines: [{
					color: 'black', // Color value
					dashStyle: 'ShortDash', // Style of the plot line. Default to solid
					value: activeUser.userData.AIChartLineValue, // Value of where the line will appear
					width: 2, // Width of the line
					label: { 
						text: 'Normalverdi', // Content of the label. 
						align: 'left'
					}
				}]
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

		$("#activityChartContainer").show();
		activityChart = new Highcharts.Chart(activityChartOptions);
	}
}