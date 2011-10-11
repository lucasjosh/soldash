function command_click(command, host, element_id) {
	changeIcon(element_id, "working");
	var auth = '';
	if(! $.isEmptyObject(host['auth'])) {
		auth = "&username=" + host['auth']['username'] + "&password=" + host['auth']['password'];
	}
	$.ajax({
	  url: "/execute/" + command,
	  type: "POST",
	  data: "host=" + host['hostname'] + "&port=" + host['port'] + auth,
	  success: function(data, status, jqXHR){
		handleResponse(command, data, status, host, element_id);
		}
	});
}

function handleResponse(command, data, status, host, element_id) {
	if(data['data']['status'] == 'ERROR') {
		changeIcon(element_id, "error");
		setStatusBar(data['data']['message'], 'error', 5);
	} else if(data['data']['status'] == 'OK') {
		changeIcon(element_id, "success");
		setStatusBar('Success!', 'success', 2);
	}
}

function setStatusBar(text, css, hide_seconds) {
	/**
	 * text: the status bar's html content
	 * css: a css class to add
	 * hide_seconds: hide the statusbar after n seconds
	 * 
	 */
	var bar = $('#statusbar');
	bar.removeAttr("style");
	bar.removeClass('hidden success error');
	bar.addClass(css);
	bar.html(text);
	setTimeout(function() {
	    bar.fadeOut('slow');
	}, hide_seconds * 1000);
}

function hideStatusBar() {
	var bar = $('#statusbar');
	bar.addClass('hidden');
	bar.html('');
}

function changeIcon(element_id, new_icon) {
	$(element_id).removeClass("ready success error working");
	$(element_id).addClass(new_icon);
}