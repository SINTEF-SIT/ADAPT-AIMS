// ******************************************************************************
// Contains functions used by more than one of the main views of the AIMS system
// ******************************************************************************

function showToast(formID, success, msg, duration) {
	// Displays a 'toast', a popup text box at the bottom of the screen, for a few seconds.
	// Typically used for providing feedback after form submission.
	// Success = green gox with check icon
	// Unsuccessful = red box with cross icon

	console.log("Toast message displayed: " + msg);

	if (success) {
		$(formID).removeClass("toast-error").addClass("toast-success"); // Replaces toast-error class (if set) with toast-success class
		$(formID + 'Img').attr("src","../img/check.png"); // Sets source of img tag inside toast to check icon
		if (!msg) msg = "Suksess!"; // Sets default text if not provided in paramterer
	} else {
		$(formID).removeClass("toast-success").addClass("toast-error"); // Replaces toast-success class (if set) with toast-error class
		$(formID + 'Img').attr("src","../img/error.png"); // Sets source of img tag inside toast to error icon
		if (!msg) msg = "Det har oppstått en feil."; // Sets default text if not provided in paramterer
	}

	$(formID + 'Text').text($.trim(msg)); // Inserts the text into the DOM

	// Displays toast, and defines millisecond values for fade-in, and, if the duration parameter is set, the delay before fade-out and fade-out time
	if (duration === null) {
		$(formID).stop().fadeIn(400);
	} else {
		$(formID).stop().fadeIn(400).delay(duration).fadeOut(400);
	}
}



function showLoader() {
	// Displays a loading widget. Mainly used while doing ajax API calls.
	$('div.ui-loader').show();

	/*$.mobile.loading( "show", {
		text: '',
		textVisible: false,
		theme: 'a',
		textonly: false,
		html: ''
    });*/
}

function hideLoader() {
	$('div.ui-loader').hide();
	
	// Hides the loading widget.
	//$.mobile.loading( "hide" );
}


function logout() {
	// Removes localStorage values,
	// and redirects to the login page.
	localStorage.removeItem("firstname");
	localStorage.removeItem("lastname");
	localStorage.removeItem("userid");
	localStorage.removeItem("username");
	localStorage.removeItem("isexpert");
	localStorage.removeItem("token");

	window.location.replace("index.html");
}