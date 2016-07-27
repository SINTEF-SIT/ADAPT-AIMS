<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function wirteDB($expertUserID) {
		include('../inc/db.inc.php');

		if (checkExpertSeniorLink($conn, $expertUserID, $_POST["seniorUserID"])) {
			
			$address = isset($_POST["address"]) ? encrypt($_POST["address"]) : NULL;
			$zipCode = isset($_POST["zipCode"]) ? encrypt($_POST["zipCode"]) : NULL;
			$city = isset($_POST["city"]) ? encrypt($_POST["city"]) : NULL;
			$phone = isset($_POST["phone"]) ? encrypt($_POST["phone"]) : NULL;
			$weight = isset($_POST["weight"]) ? $_POST["weight"] : NULL;
			$height = isset($_POST["height"]) ? $_POST["height"] : NULL;
			$falls3Mths = isset($_POST["falls3Mths"]) ? $_POST["falls3Mths"] : NULL;
			$falls12Mths = isset($_POST["falls12Mths"]) ? $_POST["falls12Mths"] : NULL;
			$comment = isset($_POST["comment"]) ? encrypt($_POST["comment"]) : NULL;

			$usesWalkingAid = isset($_POST["walkingAid"]) ? "1" : "0";
			$livingIndependently = isset($_POST["livingIndependently"]) ? "1" : "0";

			if ($stmt = $conn->prepare("UPDATE Users AS u, SeniorUsers AS su
					SET u.firstName=?, u.lastName=?, u.email=?,
					su.address=?, su.zipCode=?, su.city=?, su.phoneNumber=?,
					su.weight=?, su.height=?, su.usesWalkingAid=?, 
					su.livingIndependently=?, su.numFalls3Mths=?, 
					su.numFalls12Mths=?, su.comment=?
					WHERE su.userID = u.userID AND u.userID = ?;")) {
				$stmt->bind_param("sssssssiiiiiisi", encrypt($_POST["firstName"]), encrypt($_POST["lastName"]), encrypt($_POST["email"]), $address, $zipCode, $city, $phone, $weight, $height, $usesWalkingAid, $livingIndependently, $falls3Mths, $falls12Mths, $comment, $_POST["seniorUserID"]);
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

	$tokenUserID = validateToken();

	if ($tokenUserID != null) {
		if (isset($_POST["firstName"]) && isset($_POST["lastName"]) && isset($_POST["email"]) && isset($_POST["seniorUserID"])) {

			$dbWriteSuccess = wirteDB($tokenUserID);

			if ($dbWriteSuccess) {
				deliver_response(200, "Opplysningene ble lagret i databasen.", true);
			} else {
				deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
			}
		} else {
			deliver_response(400, "Ugyldig forespørsel.", NULL);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
?>