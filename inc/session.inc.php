<?php
	include('db.inc.php');
	session_start();
	
	if ($conn != null) {
		if(!isset($_SESSION['email_expert_user']) && !isset($_SESSION['email_senior_user'])){
			header("location:login.php");
		} else {
			$email;
			if (isset($_SESSION['email_expert_user'])) {
				$email = $_SESSION['email_expert_user'];
			} else {
				$email = $_SESSION['email_senior_user'];
			}
			if ($stmt = $conn->prepare("SELECT * FROM Users WHERE email = ?")) {
				$stmt->bind_param("s", $email);
				$stmt->execute();
				$result = $stmt->get_result();
				$row = mysqli_fetch_assoc($result);
				$firstName = $row['firstName'];
				$lastName = $row['lastName'];
			}
		}
		$conn->close();
	}
?>