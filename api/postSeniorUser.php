<?php
	include('deliver_response.inc.php');

	// Status codes
	$OK = 1;
	$PARTIALLY = -1;
	$NOTHING = -2;

	function wirteDB() {
		include('../inc/db.inc.php');

		$address = empty($_POST["address"]) ? NULL : $_POST["address"];
		$zipCode = empty($_POST["zipCode"]) ? NULL : $_POST["zipCode"];
		$city = empty($_POST["city"]) ? NULL : $_POST["city"];
		$phone = empty($_POST["phone"]) ? NULL : $_POST["phone"];
		$weight = empty($_POST["weight"]) ? NULL : $_POST["weight"];
		$height = empty($_POST["height"]) ? NULL : $_POST["height"];

		$usesWalkingAid = empty($_POST["walkingAid"]) ? "0" : "1";
		$livingIndependently = empty($_POST["livingIndependently"]) ? "0" : "1";


		if ($stmt = $conn->prepare("INSERT INTO Users (email, password, firstName, lastName) VALUES (?,?,?,?)")) {
			$stmt->bind_param("ssss", $_POST["email"], $_POST["password"], $_POST["firstName"], $_POST["lastName"]);
			$stmt->execute();

			$seniorUserID = mysqli_insert_id($conn);
			return $seniorUserID;

			/*if ($stmt = $conn->prepare("INSERT INTO Users (userID, address, zipCode, city, phoneNumber, birthDate, isMale, weight, height, usesWalkingAid, livingIndependently, dateJoinedAdapt, active) VALUES (?,?,?,?,?,?,?,?,?,?,?, NOW(), b'1')")) {
				$stmt->bind_param("isisisiiiii", $seniorUserID, $address, $zipCode, $city, $phone, $_POST["birthDate"], $_POST["isMale"], $weight, $height, $usesWalkingAid, $livingIndependently);
				$stmt->execute();

				if ($stmt = $conn->prepare("INSERT INTO ExpertSeniorLink (expertUserID, seniorUserID) VALUES (?,?)")) {
					$stmt->bind_param("ii", $_POST["expertUserID"], $seniorUserID);
					$stmt->execute();
					return $OK;
				} else {
					return $PARTIALLY;
				}
				
			} else {
				return $PARTIALLY;
			}*/
		} else {
			return $NOTING;
		}

		$conn->close();
	}

	header("Content-Type:application/json");

	if (isset($_POST["expertUserID"]) && isset($_POST["email"]) && isset($_POST["password"]) && isset($_POST["firstName"]) && isset($_POST["lastName"]) && isset($_POST["birthDate"]) && isset($_POST["isMale"])) {
		
		$dbWriteSuccess = wirteDB();
		
		if (true/*$dbWriteSuccess == $OK*/) {
			deliver_response(200, "OK! SeniorUserID=" . $seniorUserID, true);
		} else {
			deliver_response(200, "Feil! SeniorUserID=" . $dbWriteSuccess, false);
		}
	} else {
		deliver_response(400, "Ugyldig foresp\u00f8rsel.", NULL);
	}
?>