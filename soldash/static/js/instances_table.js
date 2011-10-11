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
	console.log(data);
	if(data['data']['status'] == 'ERROR') {
		changeIcon(element_id, "error");
	} else if(data['data']['status'] == 'OK') {
		changeIcon(element_id, "success");
	}
}

function changeIcon(element_id, new_icon) {
	$(element_id).removeClass("ready success error working");
	$(element_id).addClass(new_icon);
}