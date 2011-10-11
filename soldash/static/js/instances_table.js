function command_click(command, solr_host, solr_port) {
	$.ajax({
	  url: "/execute/" + command,
	  type: "GET",
	  data: "host=" + solr_host + "&port=" + solr_port,
	  success: handleResponse
	});
}

function handleResponse(data, status, jqXHR) {
	console.log(data);
}