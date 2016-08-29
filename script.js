$(document).ready(function() {
	// Listens for the submit of the login form
	$("#loginForm").submit(function(e) {

		var url = window.location.href;
		url = url.substring(0, url.lastIndexOf("/") + 1);

		formData = $("#loginForm").serialize();
		$.ajax({
			type: "POST",
			url: "api/login.php",
			data: formData,
			success: function(data, status) {
				// If API call returns data (successful login):
				if (data.data) {
					// Store data about logged in user in localstorage
					localStorage.setItem("userid", data.data.userID);
					localStorage.setItem("token", data.data.token);

					// Redirect to admin page if login data match admin user
					if (data.data.isAdmin) {
						window.location.href = "admin/index.html";
					} else {
						localStorage.setItem("firstname", data.data.firstName);
						localStorage.setItem("lastname", data.data.lastName);
						localStorage.setItem("username", $("#usernameField").val());
						localStorage.setItem("isexpert", data.data.isExpert);
						

						// Redirects the browser depending on whether the user has an expert or a senior account type
						if (data.data.isExpert) {
							window.location.href = "expert/index.html";
						} else {
							window.location.href = "senior/index.html";
						}
					}
				} else {
					// Display toast with error message if login credentials were incorrect
					showToast("#toastloginForm", false, data.status_message);
				}
			},
			error: function(data, status) {
				// Display toast with error message if an error occured during API call
				showToast("#toastloginForm", false, data.status_message);
			}
		});
		return false;
	});
});