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

	function putSettings($BIThresholdLower, $BIThresholdUpper) {
		
		include('inc/db.inc.php');
			
		if ($stmt = $conn->prepare("UPDATE Settings SET BIThresholdLower=?, BIThresholdUpper=?;")) {
			$stmt->bind_param("dd", $BIThresholdLower, $BIThresholdUpper);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return true;
		}
		$conn->close();
		return false;
	}
?>