function initialise() {
	var instances_tables = $('.instances');
	for(var i=0; i<instances_tables.length; i++) {
		compareSlaveVersionsWithMaster(instances_tables[i].id);
	}
}

function command_click(command, host, element_id) {
	/**
	 * command: solr command to be executed
	 * host: of the form 
	 *   {hostname: 'localhost', port: 8888, auth: {username: 'abc', password: 'def'}, index: 'indexname'}
	 * element_id: id of the element that was clicked to trigger this function
	 */
	changeIcon(element_id, 'working');
	var auth = '';
	var params = ''
	if(! $.isEmptyObject(host['auth'])) {
		auth = '&username=' + host['auth']['username'] + '&password=' + host['auth']['password'];
	}
	if(command === 'filelist') {
		params += '&indexversion=' + getIndexVersionFromElementID(element_id);
	}
	console.log(host);
	$.ajax({
	  url: '/execute/' + command,
	  type: 'POST',
	  data: 'host=' + host['hostname'] + '&port=' + host['port'] + '&index=' + host['index'] + auth + params,
	  success: function(data, status, jqXHR){
		handleCommandResponse(command, data, status, host, element_id);
		}
	});
}

function handleCommandResponse(command, data, status, host, element_id) {
	/**
	 * command: same as in command_click()
	 * data: jsonified response from server
	 * status: whether the call itself could be made to the solr server
	 *   (status being 'ok' doesn't preclude data['status'] from being 'ERROR')
	 * host: same as in command_click()
	 * element_id: same as in command_click() 
	 */
	if(data['data']['status'] == 'ERROR') {
		changeIcon(element_id, 'error');
		setStatusBar(data['data']['message'], 'error', 5);
	} else if(data['data']['status'] == 'OK') {
		changeIcon(element_id, 'success');
		setStatusBar('Success!', 'success', 2);
	} else if(data['data']['status'] == 'no indexversion specified') {
		changeIcon(element_id, 'error');
		setStatusBar(data['data']['status'], 'error', 5);
	} else if(command === 'filelist' && data['data']['filelist']) {
		changeIcon(element_id, 'success');
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
	bar.removeAttr('style');
	bar.removeClass('hidden success error');
	bar.addClass(css);
	bar.html(text);
	setTimeout(function() {
	    bar.fadeOut('slow');
	}, hide_seconds * 1000);
}

function changeIcon(element_id, new_icon) {
	/**
	 * element_id: id of the element that was clicked to trigger this function 
	 * new_icon: a css class to be added to change the icon
	 */
	$('#' + element_id).removeClass('ready success error working');
	$('#' + element_id).addClass(new_icon);
}

/**
 * Functions for IndexVersion checking and comparisons. 
 * 
 */
function compareSlaveVersionsWithMaster(table_id) {
	var table = $('#' + table_id);
	var master = getMasterVersion(table);
	if(!master) {
		return false;
	}
	var slaves = $('.slave');
	for(var i=0; i<slaves.length; i++) {
		var row_id = getRowID(slaves[i]);
		if(getIndexVersion(row_id) !== master) {
			$('#' + row_id).children('.version').addClass('out_of_sync');
		}
	}
}

function getMasterVersion(table) {
	var masters = table.find('.master');
	var table_name = $(table).attr('id').replace('instances_','');
	if(masters.length < 1) {
		if(table_name === 'None') {
			alert('No masters online for the default index.')
		} else {
			alert('No masters online for index ' + table_name);
		}
		return false;
	}
	var retval = areAllVersionsEqual(masters);
	if(!retval) {
		alert('Master instances have differing IndexVersions.');
	}
	return retval
}

function areAllVersionsEqual(cells) {
	var index_versions = [];
	for(var i=0; i<cells.length; i++) {
		var row_id = getRowID(cells[i]);
		index_versions.push(getIndexVersion(row_id));
	}
	var last_entry; 
	for(var i=0; i<index_versions.length; i++) {
		if (i==0) {
			last_entry = index_versions[i];
		} else {
			if(index_versions[i] !== last_entry) {
				return false;
			}
		}
	}
	return last_entry;
}

function getRowID(element) {
	var cell = $(element);
	return cell.closest('tr')[0].id;
}

function getIndexVersion(row_id) {
	return $('#' + row_id).children('.version').text();
}
function getIndexVersionFromElementID(element_id) {
	return getIndexVersion(getRowID($('#' + element_id)));
}

/**
 * End
 *
 */
