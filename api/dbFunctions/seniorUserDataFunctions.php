<?php
	function getAllSeniorUserData() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT su.*, u.firstName, u.lastName, u.username
				FROM Users AS u
				INNER JOIN SeniorUsers AS su ON u.userID = su.userID;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($row = mysqli_fetch_assoc($result)) {
					if ($row["firstName"] !== null) $row["firstName"] = decrypt($row["firstName"]);
					if ($row["lastName"] !== null) $row["lastName"] = decrypt($row["lastName"]);
					if ($row["username"] !== null) $row["username"] = decrypt($row["username"]);
					if ($row["address"] !== null) $row["address"] = decrypt($row["address"]);
					if ($row["zipCode"] !== null) $row["zipCode"] = decrypt($row["zipCode"]);
					if ($row["city"] !== null) $row["city"] = decrypt($row["city"]);
					if ($row["email"] !== null) $row["email"] = decrypt($row["email"]);
					if ($row["phoneNumber"] !== null) $row["phoneNumber"] = decrypt($row["phoneNumber"]);
					if ($row["birthDate"] !== null) $row["birthDate"] = decrypt($row["birthDate"]);
					if ($row["comment"] !== null) $row["comment"] = decrypt($row["comment"]);
					$rows[] = $row;
				}
				$conn->close();
				return $rows;
			}
		}
		$conn->close();
		return NULL;
	}

	function getSeniorUserData($tokenUserID, $seniorUserID) {
		include('inc/db.inc.php');

		// If the userID in the token belongs to an expert user, check that this expert is allowed to access this senior user's data
		if ($tokenUserID != $seniorUserID) {
			if (checkExpertSeniorLink($conn, $tokenUserID, $seniorUserID) == false) {
				return null;
			}
		}

		if ($stmt = $conn->prepare("SELECT su.*, u.firstName, u.lastName, u.username
				FROM Users AS u
				INNER JOIN SeniorUsers AS su ON u.userID = su.userID
				WHERE u.userID = ?;")) {
			$stmt->bind_param("i", $seniorUserID);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$row = mysqli_fetch_assoc($result);

				if ($row["firstName"] != null) $row["firstName"] = decrypt($row["firstName"]);
				if ($row["lastName"] != null) $row["lastName"] = decrypt($row["lastName"]);
				if ($row["username"] != null) $row["username"] = decrypt($row["username"]);
				if ($row["address"] != null) $row["address"] = decrypt($row["address"]);
				if ($row["zipCode"] != null) $row["zipCode"] = decrypt($row["zipCode"]);
				if ($row["city"] != null) $row["city"] = decrypt($row["city"]);
				if ($row["email"] != null) $row["email"] = decrypt($row["email"]);
				if ($row["phoneNumber"] != null) $row["phoneNumber"] = decrypt($row["phoneNumber"]);
				if ($row["birthDate"] != null) $row["birthDate"] = decrypt($row["birthDate"]);
				if ($row["comment"] != null) $row["comment"] = decrypt($row["comment"]);

				$conn->close();
				return $row;
			}
		}
		$conn->close();
		return NULL;
	}

	function postSeniorUserData($expertUserID) {
		include('inc/db.inc.php');

		$address = isset($_POST["address"]) ? encrypt($_POST["address"]) : NULL;
		$zipCode = isset($_POST["zipCode"]) ? encrypt($_POST["zipCode"]) : NULL;
		$city = isset($_POST["city"]) ? encrypt($_POST["city"]) : NULL;
		$email = isset($_POST["email"]) ? encrypt($_POST["email"]) : NULL;
		$phone = isset($_POST["phone"]) ? encrypt($_POST["phone"]) : NULL;
		$weight = isset($_POST["weight"]) ? $_POST["weight"] : NULL;
		$height = isset($_POST["height"]) ? $_POST["height"] : NULL;
		$falls3Mths = isset($_POST["falls3Mths"]) ? $_POST["falls3Mths"] : NULL;
		$falls12Mths = isset($_POST["falls12Mths"]) ? $_POST["falls12Mths"] : NULL;
		$comment = isset($_POST["comment"]) ? encrypt($_POST["comment"]) : NULL;
		$AIChartLineValue = isset($_POST["AIChartLineValue"]) ? $_POST["AIChartLineValue"] : NULL;

		$usesWalkingAid = isset($_POST["walkingAid"]) ? "1" : "0";
		$livingIndependently = isset($_POST["livingIndependently"]) ? "1" : "1";

		$password = hashword($_POST["password"]);


		if ($stmt1 = $conn->prepare("INSERT INTO Users (username, password, firstName, lastName) VALUES (?,?,?,?)")) {
			$stmt1->bind_param("ssss", encrypt($_POST["username"]), $password, encrypt($_POST["firstName"]), encrypt($_POST["lastName"]));
			$stmt1->execute();

			$seniorUserID = (int) mysqli_insert_id($conn);
			$stmt1->close();

			if ($stmt2 = $conn->prepare("INSERT INTO SeniorUsers (userID, address, zipCode, city, email, phoneNumber, birthDate, isMale, weight, height, usesWalkingAid, livingIndependently, numFalls3Mths, numFalls12Mths, comment, AIChartLineValue, dateJoinedAdapt, active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, UTC_TIMESTAMP(), b'1')")) {
				$stmt2->bind_param("issssssiiiiiiisd", $seniorUserID, $address, $zipCode, $city, $email, $phone, encrypt($_POST["birthDate"]), $_POST["isMale"], $weight, $height, $usesWalkingAid, $livingIndependently, $falls3Mths, $falls12Mths, $comment, $AIChartLineValue);
				$stmt2->execute();
				$stmt2->close();

				if ($stmt3 = $conn->prepare("INSERT INTO ExpertSeniorLink (expertUserID, seniorUserID) VALUES (?,?)")) {
					$stmt3->bind_param("ii", $_POST["expertUserID"], $seniorUserID);
					$stmt3->execute();
					$stmt3->close();

					$conn->close();
					return true;
				}
			}
		}
		$conn->close();
		return false;
	}

	function putSeniorUserData($expertUserID) {
		include('inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $_POST["seniorUserID"])) {
			
			$address = isset($_POST["address"]) ? encrypt($_POST["address"]) : NULL;
			$zipCode = isset($_POST["zipCode"]) ? encrypt($_POST["zipCode"]) : NULL;
			$city = isset($_POST["city"]) ? encrypt($_POST["city"]) : NULL;
			$email = isset($_POST["email"]) ? encrypt($_POST["email"]) : NULL;
			$phone = isset($_POST["phone"]) ? encrypt($_POST["phone"]) : NULL;
			$weight = isset($_POST["weight"]) ? $_POST["weight"] : NULL;
			$height = isset($_POST["height"]) ? $_POST["height"] : NULL;
			$falls3Mths = isset($_POST["falls3Mths"]) ? $_POST["falls3Mths"] : NULL;
			$falls12Mths = isset($_POST["falls12Mths"]) ? $_POST["falls12Mths"] : NULL;
			$comment = isset($_POST["comment"]) ? encrypt($_POST["comment"]) : NULL;
			$AIChartLineValue = isset($_POST["AIChartLineValue"]) ? $_POST["AIChartLineValue"] : NULL;

			$usesWalkingAid = isset($_POST["walkingAid"]) ? "1" : "0";
			$livingIndependently = isset($_POST["livingIndependently"]) ? "1" : "0";

			if ($stmt = $conn->prepare("UPDATE Users AS u, SeniorUsers AS su
					SET u.firstName=?, u.lastName=?, u.username=?,
					su.address=?, su.zipCode=?, su.city=?, su.email=?, 
					su.phoneNumber=?, su.weight=?, su.height=?, 
					su.usesWalkingAid=?, su.livingIndependently=?, 
					su.numFalls3Mths=?, su.numFalls12Mths=?, su.comment=?,
					su.AIChartLineValue=?
					WHERE su.userID = u.userID AND u.userID = ?;")) {
				$stmt->bind_param("ssssssssiiiiiisdi", encrypt($_POST["firstName"]), encrypt($_POST["lastName"]), encrypt($_POST["username"]), $address, $zipCode, $city, $email, $phone, $weight, $height, $usesWalkingAid, $livingIndependently, $falls3Mths, $falls12Mths, $comment, $AIChartLineValue, $_POST["seniorUserID"]);
				$stmt->execute();
				$stmt->close();
				$conn->close();
				return true;
			}
		}
		$conn->close();
		return false;
	}
?>