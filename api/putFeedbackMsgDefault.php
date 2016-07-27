<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($msgID, $exerciseID, $feedbackText) {
		include('../inc/db.inc.php');
			
		if ($stmt = $conn->prepare("UPDATE FeedbackMsgDefault SET feedbackText=?, exerciseID=? WHERE msgID=?;")) {
			$stmt->bind_param("sii", $feedbackText, $exerciseID, $msgID);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return true;
		} else {
			$conn->close();
			return false;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {

		$successCounter = 0;
		$totalCounter = 0;

		foreach ($_POST as $key => $value) {
			if (strstr($key, 'msg')) {
				$keywords = preg_split("/-/", $key);
				$msgID = $keywords[1];
				$feedbackText = $value;
				$exerciseKey = "exercise-" . $msgID;
				if (isset($_POST[$exerciseKey])) {
					$exerciseID = $_POST[$exerciseKey];
					if ($exerciseID < 0) {
						$exerciseID = null;
					}

					$dbWriteSuccess = wirteDB($msgID, $exerciseID, $feedbackText);
					if ($dbWriteSuccess) {
						$successCounter++;
					}
				}
				$totalCounter++;
				
			}
		}

		deliver_response(200, $successCounter . " av " . $totalCounter . " råd ble oppdatert.", true);
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>