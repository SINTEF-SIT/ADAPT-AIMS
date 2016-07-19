<?php
	/*function console_log( $data ){
		echo '<script>';
		echo 'console.log('. json_encode( $data ) .')';
		echo '</script>';
	}*/
	
	$conn = mysqli_connect('127.0.0.1','root','','adapt');

	/* check connection */
	if (mysqli_connect_errno()) {
		//console_log("Connect failed: %s\n", mysqli_connect_error());
		exit();
	}

	function encrypt($string) {
		$string = rtrim(base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, md5('adapt2016'), $string, MCRYPT_MODE_ECB)));
		return $string;
	}

	function decrypt($string) {
		$string = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5('adapt2016'), base64_decode($string), MCRYPT_MODE_ECB));
		return $string;
	}

	function hashword($string) {
		$string = crypt($string, '$1$' . md5('adapt2016') . '$');
		return $string;
	}

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
?>