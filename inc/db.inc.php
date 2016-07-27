<?php
	
	$conn = mysqli_connect('127.0.0.1','root','','adapt');

	/* check connection */
	if (mysqli_connect_errno()) {
		printf("Connect failed: %s\n", mysqli_connect_error());
		exit();
	}

	if (!mysqli_set_charset($conn, "utf8")) {
		printf("Error loading character set utf8: %s\n", mysqli_error($conn));
		exit();
	}

	
	
	//******************************************************
	//********************* FUNCTIONS: *********************
	//******************************************************

	if (!function_exists('encrypt')) {
		function encrypt($string) {
			$string = rtrim(base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, md5('adapt2016'), $string, MCRYPT_MODE_ECB)));
			return $string;
		}
	}

	if (!function_exists('decrypt')) {
		function decrypt($string) {
			$string = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5('adapt2016'), base64_decode($string), MCRYPT_MODE_ECB));
			return $string;
		}
	}

	if (!function_exists('hashword')) {
		function hashword($string) {
			$string = crypt($string, '$1$' . md5('adapt2016') . '$');
			return $string;
		}
	}

	if (!function_exists('checkExpertSeniorLink')) {
		function checkExpertSeniorLink($conn, $expertUserID, $seniorUserID) {
			if ($stmt = $conn->prepare("SELECT su.userID
					FROM SeniorUsers AS su
					INNER JOIN ExpertSeniorLink AS esl ON esl.seniorUserID = su.userID
					WHERE su.active = 1 AND esl.expertUserID = ?;")) {
				$stmt->bind_param("i", $expertUserID);
				$stmt->execute();
				$result = $stmt->get_result();
				$stmt->close();

				if (mysqli_num_rows($result) > 0) {
					while ($r = mysqli_fetch_assoc($result)) {
						if ($r["userID"] == $seniorUserID) {
							return true;
						}
					}
				}
			}
			return false;
		}
	}
?>