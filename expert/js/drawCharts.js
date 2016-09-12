//********************************************************************
//                   Draws the balance idx chart
//********************************************************************
function drawBIChart() {
	if (activeUser.balanceIndexes !== null) {
		var balanceChartData = [];

		for (var i=0; i<activeUser.balanceIndexes.length; i++) {
			// Comment out if chart is changed to a column chart!
			if (i != 0) {
				// Draws an extra data point right before each data point (except the first) 
				// to get a flat line instead of a straight, diagonal line between the points.
				// Needs to be commented out if the chart is switched to a column chart.
				var dataPointPre = [];
				var datePre = moment.tz(activeUser.balanceIndexes[i].timeDataCollected, "UTC");
				datePre.seconds(-1);
				dataPointPre.push(datePre.valueOf());
				dataPointPre.push(parseFloat(activeUser.balanceIndexes[i-1].value));
				balanceChartData.push(dataPointPre);
			}

			var bi = parseFloat(activeUser.balanceIndexes[i].value);

			var dataPoint = [];
			var date = moment.tz(activeUser.balanceIndexes[i].timeDataCollected, "UTC");
			dataPoint.push(date.valueOf());
			dataPoint.push(bi);
			balanceChartData.push(dataPoint);

			// Comment out if chart is changed to a column chart!
			// If last data point from db, add a final data point at the current datetime
			if (i+1 == activeUser.balanceIndexes.length) {
				var dataPointFinal = [];
				dataPointFinal.push(date.valueOf() + (1000 * 60 * 60 * 24));
				dataPointFinal.push(parseFloat(activeUser.balanceIndexes[i].value));
				var value = parseFloat(activeUser.balanceIndexes[i].value);
				balanceChartData.push(dataPointFinal);

				activeUser.userData.balanceIdx = value;
			}
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
				tickInterval: 24 * 3600 * 1000 // How frequent a tick is displayed on the axis (set in milliseconds)
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
function drawAIChart() {
	if (activeUser.activityIndexes !== null) {
		var activityChartData = [];
		for (var i=0; i<activeUser.activityIndexes.length; i++) {
			var dataPoint = [];
			var date = moment.tz(activeUser.activityIndexes[i].timeDataCollected, "UTC");
			dataPoint.push(date.valueOf());
			dataPoint.push(activeUser.activityIndexes[i].value);
			activityChartData.push(dataPoint);
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