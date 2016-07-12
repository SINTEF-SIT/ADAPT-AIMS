$(document).ready(function() {
	$("#loginForm").submit(function(e) {

		formData = $("#loginForm").serialize();
		$.ajax({
			type: "POST",
			url: "http://vavit.no/adapt-staging/api/login.php",
			data: formData,
			success: function(data, status) {
				if (data.data) {
					localStorage.setItem("firstname", data.data.firstName);
					localStorage.setItem("lastname", data.data.lastName);
					localStorage.setItem("userid", data.data.userID);
					localStorage.setItem("email", $("#emailField").val());
					localStorage.setItem("isexpert", data.data.isExpert);
					localStorage.setItem("token", data.data.token);

					if (data.data.isExpert) {
						window.location.href = "expert/index.html";
					} else {
						window.location.href = "senior/index.html";
					}
				} else {
					showToast("#toastloginForm", false, data.status_message);
				}
			},
			error: function(data, status) {
				showToast("#toastloginForm", false, data.status_message);
			}
		});
		return false;
	});
});

function showToast(formID, success, msg) {
	if (success) {
		$(formID).removeClass("toast-error").addClass("toast-success");
		$(formID + 'Img').attr("src","expert/img/check.png");
		if (!msg) msg = "Suksess!";
	} else {
		$(formID).removeClass("toast-success").addClass("toast-error");
		$(formID + 'Img').attr("src","expert/img/error.png");
		if (!msg) msg = "Det har oppstått en feil.";
	}

	$(formID + 'Text').text($.trim(msg));
	$(formID).stop().fadeIn(400).delay(3000).fadeOut(400); //fade out after 3 seconds
}