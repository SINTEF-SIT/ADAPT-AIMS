function showToast(formID, success, msg) {
	// Displays a 'toast', a popup text box at the bottom of the screen, for a few seconds.
	// Typically used for providing feedback after form submission.
	// Success = green gox with check icon
	// Unsuccessful = red box with cross icon

	if (success) {
		$(formID).removeClass("toast-error").addClass("toast-success"); // Replaces toast-error class (if set) with toast-success class
		$(formID + 'Img').attr("src","img/check.png"); // Sets source of img tag inside toast to check icon
		if (!msg) msg = "Suksess!"; // Sets default text if not provided in paramterer
	} else {
		$(formID).removeClass("toast-success").addClass("toast-error"); // Replaces toast-success class (if set) with toast-error class
		$(formID + 'Img').attr("src","img/error.png"); // Sets source of img tag inside toast to error icon
		if (!msg) msg = "Det har oppstått en feil."; // Sets default text if not provided in paramterer
	}

	$(formID + 'Text').text($.trim(msg)); // Inserts the text into the DOM
	$(formID).stop().fadeIn(400).delay(3000).fadeOut(400); // Displays toast, and defines millisecond values for fade-in, delay before fade-out, and fade-out
}



function showLoader() {
	// Displays a loading widget. Mainly used while doing ajax API calls.
	$.mobile.loading( "show"/*, {
		text: '',
		textVisible: false,
		theme: 'a',
		textonly: false,
		html: ''
    }*/);
}

function hideLoader() {
	// Hides the loading widget.
	$.mobile.loading( "hide" );
}