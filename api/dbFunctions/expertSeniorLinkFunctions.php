<?php
	function postExpertSeniorLinks($expertUserID, $seniorUserID) {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("INSERT INTO ExpertSeniorLink (expertUserID, seniorUserID) VALUES (?, ?);")) {
			$stmt->bind_param("ii", $expertUserID, $seniorUserID);
			$stmt->execute();

			$stmt->close();
			$conn->close();
			return true;
		} else {
			$conn->close();
			return false;
		}
	}

	function deleteExpertSeniorLinks($expertUserID) {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("DELETE FROM ExpertSeniorLink WHERE expertUserID=?")) {
			$stmt->bind_param("i", $expertUserID);
			$stmt->execute();
			$stmt->close();
			$conn->close();
			return true;
		} else {
			return false;
		}
	}
?>