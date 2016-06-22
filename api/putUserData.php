<?php
	include('deliver_response.inc.php');

	function wirteDB() {
		include('../inc/db.inc.php');

		$usesWalkingAid = isset($_POST["walkingAid"]) ? "1" : "0";
		$livingIndependently = isset($_POST["livingIndependently"]) ? "1" : "0";

		if ($stmt = $conn->prepare("UPDATE Users AS u, SeniorUsers AS su SET u.firstName=?, u.lastName=?, su.address=?, su.zipCode=?, su.city=?, su.phoneNumber=?, su.weight=?, su.height=?, su.usesWalkingAid=?, su.livingIndependently=? WHERE su.userID = u.userID AND u.userID = ?;")) {
			$stmt->bind_param("sssisiiiiii", $_POST["firstName"], $_POST["lastName"], $_POST["address"], $_POST["zipCode"], $_POST["city"], $_POST["phone"], $_POST["weight"], $_POST["height"], $usesWalkingAid, $livingIndependently, $_POST["userID"]);
			$stmt->execute();
			return true;
		} else {
			return false;
		}

		$conn->close();
	}

	header("Content-Type:application/json");

	if (!empty($_POST["firstName"]) && !empty($_POST["lastName"]) && !empty($_POST["address"]) && !empty($_POST["zipCode"]) && !empty($_POST["city"]) && !empty($_POST["phone"]) && !empty($_POST["weight"]) && !empty($_POST["height"]) && !empty($_POST["userID"])) {

		$dbWriteSuccess = wirteDB();

		if ($dbWriteSuccess) {
			deliver_response(200, "Opplysningene ble lagret i databasen.", true);
		} else {
			deliver_response(200, "Det ble ikke opprettet forbindelse med databasen.", false);
		}
	} else {
		deliver_response(400, "Ugyldig forespørsel.", NULL);
	}
?>