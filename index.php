<?php
	include("inc/db.inc.php");
   
	if ($conn->connect_error) {
		die("Connection failed: " . $conn->connect_error);
	} else {
		session_start();
			   
		if($_SERVER["REQUEST_METHOD"] == "POST") {
			
			
			if ($stmt = $conn->prepare("SELECT userID FROM Users WHERE email = ? and password = ? LIMIT 1")) {
				$stmt->bind_param("ss", $_POST['email'], $_POST['password']);
				$stmt->execute();
				$result = $stmt->get_result();
				$row = mysqli_fetch_assoc($result);
				$userID = $row['userID'];
				
				
				if($userID && is_numeric($userID)) {

					$_SESSION['userid'] = $userID;
					
					// Search for match in ExpertUsers table
					if ($stmtExpert = $conn->prepare("SELECT userID FROM ExpertUsers WHERE userID = ? LIMIT 1")) {
						$stmtExpert->bind_param("i", $userID);
						$stmtExpert->execute();
						$stmtExpert->store_result();
						$countExpertUsers = $stmtExpert->num_rows;
						
						if ($countExpertUsers > 0) {
							$_SESSION['email_expert_user'] = $_POST['email'];
							header("location: expert/index.php");
						} else {
							// Search for match in seniorUsers table
							if ($stmtSenior = $conn->prepare("SELECT userID FROM SeniorUsers WHERE userID = ? LIMIT 1")) {
								$stmtSenior->bind_param("i", $userID);
								$stmtSenior->execute();
								/*$result = $stmt->get_result();
								$row = mysqli_fetch_assoc($result);
								$userID = $row['userID'];*/
								$stmtSenior->store_result();
								$countSeniorUsers = $stmtSenior->num_rows;
								
								if ($countSeniorUsers > 0) {
									$_SESSION['email_senior_user'] = $_POST['email'];
									header("location: senior/index.php");
								}
							} else {
								$error = "Ugyldig brukernavn/passord";
							}
							$stmtSenior->close();
						}
					}
					$stmtExpert->close();
				}
				$stmt->close();
			}
		}
	}
	$conn->close();
?>
<html>
	<head>
		<title>AIMS</title>

		<!-- jQuery -->
		<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>

		<!-- Bootstrap -->
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>


		<style>
			.progress-bar {
			    color: #333;
			}

			* {
			    -webkit-box-sizing: border-box;
				   -moz-box-sizing: border-box;
				        box-sizing: border-box;
				outline: none;
			}

			    .form-control {
				  position: relative;
				  font-size: 16px;
				  height: auto;
				  padding: 10px;
					@include box-sizing(border-box);

					&:focus {
					  z-index: 2;
					}
				}

			body {
				background: url(login-backgr.jpg) no-repeat center center fixed;
			    -webkit-background-size: cover;
			    -moz-background-size: cover;
			    -o-background-size: cover;
			    background-size: cover;
			}

			.login-form {
				margin-top: 60px;
			}

			form[role=login] {
				color: #5d5d5d;
				background: #f2f2f2;
				padding: 26px;
				border-radius: 10px;
				-moz-border-radius: 10px;
				-webkit-border-radius: 10px;
			}
				form[role=login] img {
					display: block;
					margin: 0 auto;
					margin-bottom: 35px;
				}
				form[role=login] input,
				form[role=login] button {
					font-size: 18px;
					margin: 16px 0;
				}
				form[role=login] > div {
					text-align: center;
				}
				
			.form-links {
				text-align: center;
				margin-top: 1em;
				margin-bottom: 50px;
			}

			.form-links a {
				color: #fff;
			}
		</style>

	</head>
	<body>
		<div class="container">
		  
		  <div class="row" id="pwd-container">
		    <div class="col-md-4"></div>
		    
		    <div class="col-md-4">
		      <section class="login-form">
		        <form method="post" action="" role="login">
		          <h1 style="text-align: center; margin-top: 0; font-weight: bold;">AIMS</h1>
		          <input type="text" name="email" placeholder="E-post" required class="form-control input-lg" />
		          
		          <input type="password" name="password" class="form-control input-lg" id="password" placeholder="Passord" required />
		          
		          <button type="submit" name="go" class="btn btn-lg btn-primary btn-block">Logg inn</button>
		          
		        </form>
		      </section>  
		      </div>
		      
		      <div class="col-md-4"></div>
		      

		  </div> 
		</div>
	</body>

</html>