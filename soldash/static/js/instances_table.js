function command_click(command, solr_host, solr_port, element_id) {
	changeIcon(element_id, "working");
	$.ajax({
	  url: "/execute/" + command,
	  type: "GET",
	  data: "host=" + solr_host + "&port=" + solr_port,
	  success: function(data, status, jqXHR){
		handleResponse(command, data, status, solr_host, solr_port, element_id);
		}
	});
}

function handleResponse(command, data, status, solr_host, solr_port, element_id) {
	console.log(data);
	if(data['status'] == 'ERROR') {
		changeIcon(element_id, "error");
	} else if(data['status'] == 'OK') {
		changeIcon(element_id, "success");
	}
}

function changeIcon(element_id, new_icon) {
	$(element_id).removeClass("ready success error working");
	$(element_id).addClass(new_icon);
}