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
?>