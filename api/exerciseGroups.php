<?php
	include('inc/deliver_response.inc.php');
	include('inc/jwt.inc.php');

	function getData() {
		include('inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT * FROM ExerciseGroups;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
					$exerciseGroupID = $r["exerciseGroupID"];

					if ($stmt2 = $conn->prepare("SELECT * FROM Exercises WHERE exerciseGroupID=?;")) {
						$stmt2->bind_param("i", $exerciseGroupID);
						$stmt2->execute();
						$exercisesResult = $stmt2->get_result();
						$stmt2->close();

						if (mysqli_num_rows($exercisesResult) > 0) {
							$exerciseRows = array();
							while ($rowExercises = mysqli_fetch_assoc($exercisesResult)) {
								$exerciseRows[] = $rowExercises;
							}
							$r["exercises"] = $exerciseRows;
						} else {
							$r["balanceIdx"] = null;
						}
					} else {
						return NULL;
					}

					$rows[] = $r;
				}
				$conn->close();
				return $rows;
			} else {
				$conn->close();
				return NULL;
			}
		} else {
			$conn->close();
			return NULL;
		}
	}

	$tokenUserID = validateToken();

	if ($tokenUserID !== null) {	

		$method = $_SERVER['REQUEST_METHOD'];

		switch ($method) {
			case 'GET':
				// Get data about physical exercises
				$res = getData($seniorUserID, $tokenUserID);

				if (empty($res)) {
					deliver_response(200, "Ingen øvelser er funnet i databasen.", NULL);
				} else {
					deliver_response(200, "Øvelser funnet.", $res);
				}
				break;
			default:
				deliver_response(400, "Ugyldig forespørsel. Aksepterte forespørsel-typer: GET", NULL);
				break;
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
		
?>