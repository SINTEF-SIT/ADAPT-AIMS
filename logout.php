<?php
	session_start();
		
   	if(session_destroy()) {
   		header("Location: http://vavit.no/adapt-staging/index.php");
		exit();
	}
?>