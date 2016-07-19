<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB() {
		include('../inc/db.inc.php');

		$address = isset($_POST["address"]) ? encrypt($_POST["address"]) : NULL;
		$zipCode = isset($_POST["zipCode"]) ? encrypt($_POST["zipCode"]) : NULL;
		$city = isset($_POST["city"]) ? encrypt($_POST["city"]) : NULL;
		$phone = isset($_POST["phone"]) ? encrypt($_POST["phone"]) : NULL;
		$weight = isset($_POST["weight"]) ? $_POST["weight"] : NULL;
		$height = isset($_POST["height"]) ? $_POST["height"] : NULL;
		$falls6Mths = isset($_POST["falls6Mths"]) ? $_POST["falls6Mths"] : NULL;
		$falls12Mths = isset($_POST["falls12Mths"]) ? $_POST["falls12Mths"] : NULL;

		$usesWalkingAid = isset($_POST["walkingAid"]) ? "1" : "0";
		$livingIndependently = isset($_POST["livingIndependently"]) ? "1" : "1";

		$password = hashword($_POST["password"]);


		if ($stmt = $conn->prepare("INSERT INTO Users (email, password, firstName, lastName) VALUES (?,?,?,?)")) {
			$stmt->bind_param("ssss", encrypt($_POST["email"]), $password, encrypt($_POST["firstName"]), encrypt($_POST["lastName"]));
			$stmt->execute();

			$seniorUserID = (int) mysqli_insert_id($conn);

			if ($stmt = $conn->prepare("INSERT INTO SeniorUsers (userID, address, zipCode, city, phoneNumber, birthDate, isMale, weight, height, usesWalkingAid, livingIndependently, numFalls6Mths, numFalls12Mths, dateJoinedAdapt, active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, NOW(), b'1')")) {
				$stmt->bind_param("isssssiiiiiii", $seniorUserID, $address, $zipCode, $city, $phone, encrypt($_POST["birthDate"]), $_POST["isMale"], $weight, $height, $usesWalkingAid, $livingIndependently, $falls6Mths, $falls12Mths);
				$stmt->execute();

				if ($stmt = $conn->prepare("INSERT INTO ExpertSeniorLink (expertUserID, seniorUserID) VALUES (?,?)")) {
					$stmt->bind_param("ii", $_POST["expertUserID"], $seniorUserID);
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
				$stmt->close();
				$conn->close();
				return false;
			}
		} else {
			$conn->close();
			return false;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_POST["expertUserID"]) && isset($_POST["email"]) && isset($_POST["password"]) && isset($_POST["firstName"]) && isset($_POST["lastName"]) && isset($_POST["birthDate"]) && isset($_POST["isMale"])) {
			
			$dbWriteSuccess = wirteDB();
			
			if ($dbWriteSuccess) {
				deliver_response(200, "Brukeren ble lagret i databasen.", true);
			} else {
				deliver_response(200, "Det oppstod en feil, og en eller flere tabeller ble ikke oppdatert." . $dbWriteSuccess, false);
			}
		} else {
			deliver_response(400, "Ugyldig foresp\u00f8rsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>