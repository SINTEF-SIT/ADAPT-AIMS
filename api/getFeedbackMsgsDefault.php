<?php
	include('deliver_response.inc.php');
	include('../inc/jwt.inc.php');

	function readDB() {
		include('../inc/db.inc.php');

		if ($stmt = $conn->prepare("SELECT fmd.msgID, fmd.feedbackText, fmd.category, fmd.idx, e.* FROM FeedbackMsgDefault AS fmd LEFT JOIN Exercises AS e ON fmd.exerciseID = e.exerciseID;")) {
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();

			if (mysqli_num_rows($result) > 0) {
				$rows = array();
				while ($r = mysqli_fetch_assoc($result)) {
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

	if ($tokenUserID != null) {	
		
		$res = readDB();

		if (empty($res)) {
			deliver_response(200, "Ingen feedback-meldinger er lagret i databasen.", NULL);
		} else {
			deliver_response(200, "Feedback funnet.", $res);
		}
	} else {
		deliver_response(401, "Autentisering feilet.", NULL);
	}
		
?>