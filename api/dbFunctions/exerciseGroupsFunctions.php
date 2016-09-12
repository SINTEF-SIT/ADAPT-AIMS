<?php
	function getExerciseGroups() {
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
?>