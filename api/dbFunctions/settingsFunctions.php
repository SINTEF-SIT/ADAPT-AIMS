<?php
	function getSettings() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT * FROM Settings;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$conn->close();
				return mysqli_fetch_assoc($result);
			}
		}
		$conn->close();
		return NULL;
	}

	function putSettings($BIThresholdLower, $BIThresholdUpper, $maxXAxisIntervalDays, $BIImgHeader, $BIChartHeader, $AIChartHeader, $BIImgLabelLow, $BIImgLabelHigh, $BIChartSpectrumLabelLow, $BIChartSpectrumLabelMedium, $BIChartSpectrumLabelHigh, $BIChartLineText, $AIChartLineText, $BIImgHelpTooltipText, $BIChartHelpTooltipText, $AIChartHelpTooltipText) {
		
		include('inc/db.inc.php');
			
		if ($stmt = $conn->prepare("UPDATE Settings SET BIThresholdLower=?, BIThresholdUpper=?, maxXAxisIntervalDays=?, BIImgHeader=?, BIChartHeader=?, AIChartHeader=?, BIImgLabelLow=?, BIImgLabelHigh=?, BIChartSpectrumLabelLow=?, BIChartSpectrumLabelMedium=?, BIChartSpectrumLabelHigh=?, BIChartLineText=?, AIChartLineText=?, BIImgHelpTooltipText=?, BIChartHelpTooltipText=?, AIChartHelpTooltipText=?;")) {
			$stmt->bind_param("ddisssssssssssss", $BIThresholdLower, $BIThresholdUpper, $maxXAxisIntervalDays, $BIImgHeader, $BIChartHeader, $AIChartHeader, $BIImgLabelLow, $BIImgLabelHigh, $BIChartSpectrumLabelLow, $BIChartSpectrumLabelMedium, $BIChartSpectrumLabelHigh, $BIChartLineText, $AIChartLineText, $BIImgHelpTooltipText, $BIChartHelpTooltipText, $AIChartHelpTooltipText);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return getSettings();
		}
		$conn->close();
		return false;
	}
?>