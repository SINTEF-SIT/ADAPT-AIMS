<?php
	function getUsernameAvailability($username) {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT userID FROM Users WHERE username = ?;")) {
			$stmt->bind_param("s", encrypt($username));
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			$conn->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);
				return $row["userID"];
			} else {
				return -1;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}
?>