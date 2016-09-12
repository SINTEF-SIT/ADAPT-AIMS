<?php
	function putHasAccessedSystem($tokenUserID, $seniorUserID) {
		include('inc/db.inc.php');
			
		if ($stmt = $conn->prepare("UPDATE SeniorUsers SET hasAccessedSystem='1' WHERE userID=?;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$stmt->close();
			$conn->close();
			return true;
		}
		$conn->close();
		return false;
	}
?>