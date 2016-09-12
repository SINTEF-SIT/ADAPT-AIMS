<?php
	function putSeniorUserActiveStatus($expertUserID, $seniorUserID) {
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $seniorUserID)) {
			if ($stmt = $conn->prepare("UPDATE SeniorUsers SET active = b'0' WHERE userID = ?")) {
				$stmt->bind_param("i", $seniorUserID);
				$stmt->execute();
				$stmt->close();
				$conn->close();
				return true;
			} else {
				$stmt->close();
				$conn->close();
				return false;
			}
		} else {
			return false;
		}
	}
?>