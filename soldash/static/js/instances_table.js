function initialise() {
    /**
     * Called upon page load.
     */
    update(false);
    setSolrVersions();
    toggleRefresh(true);
    render();
}

function setSolrVersions() {
    $.ajax({
        url: '/solr_versions',
        type: 'GET',
        data: '',
        async: false,
        success: function(data, status, jqXHR){
            D['solr_versions'] = data['data'];
        }
    });
}

function toggleRefresh(on) {
    /**
     * Turns on or off the automatic refresh of data on the page.
     */
    if(on === true) {
        refreshHandler = setInterval('update(); render();', D['refresh'] * 1000);
    } else {
        clearInterval(refreshHandler);
    }
}

function update(async) {
    async = (typeof async == 'undefined') ?
            true : async;
    $.ajax({
        url: '/details',
        type: 'GET',
        data: '',
        async: async,
        success: function(data, status, jqXHR){
            // global variable of data:
            if(typeof D === 'undefined') {
                D = {'debug': data['debug'], 'refresh': data['js_refresh'], 
                     'solr_response_headers': data['solr_response_headers'], 
                    'hide_status_msg_success': data['hide_status_msg_success'],
                    'hide_status_msg_error': data['hide_status_msg_success'],
                    'commands': data['commands']};
            }
            D['data'] = data['data'];
        }
    });
}

function render() {
    EJS.config({cache: "false" === D['debug']});
    var container = $('#EJS_container');
    var result = new EJS({'url': '/static/ejs/homepage.ejs'}).render(D);
    container.html(result);
    setupClickHandlers();
}

function setupClickHandlers() {
    /**
     * Assign click handlers to all buttons.
     */
    $('.executebutton').click(function() { 
        var id = idConverter($(this)[0].id);
        var host = getHostFromID(id);
        host['core'] = id[0];
        var command = id[3];
        if($(this).attr('class').indexOf('enabled') >= 0) { 
            command = id[4];
        }
        command_click(command, host, idConverter(id));
    });
}

function getHostFromID(id) {
    /**
     * Gets a host object from an id (string or array).
     */
    if(typeof(id) === 'string') {
        id = idConverter(id);
    }
    for(var i=0; i<D['data'].length; i++) {
        var core = D['data'][i];
        if(!core['core_name'] == id[0]) {
            break;
        }
        for(var j=0; j<core['hosts'].length; j++) {
            var host = core['hosts'][j];
            if(host['hostname'] == id[1] && host['port'] == id[2]) {
                return host;
            }
        }
    }
}

function idConverter(data) {
    /**
     * Converts an executebutton's DOM element ID string to an array and vice versa.
     */
    var retval = ''
    if(typeof(data) === 'string') {
        retval = data.split('-');
        retval[1] = retval[1].replace(/\_/g,'.') 
    } else if(typeof(data) === 'object'){
        data[1] = data[1].replace(/\./g,'_');
        retval = data.join('-');
    }
    return retval;
}

function command_click(command, host, element_id) {
    /**
     * command: solr command to be executed
     * host: of the form 
     *   {hostname: 'localhost', port: 8888, auth: {username: 'abc', password: 'def'}, core: 'corename'}
     * element_id: id of the element that was clicked to trigger this function
     */
    changeIcon(element_id, 'working');
    data = getSupportingPOSTData(command, host, element_id);
    $.ajax({
        url: '/execute/' + command,
        type: 'POST',
        data: data,
        success: function(data, status, jqXHR){
            handleCommandResponse(command, data, status, host, element_id);
        }
    });
}

function getSupportingPOSTData(command, host, element_id) {
    /**
     * Extract extra data to be sent in the POST request.
     */
    var retval = 'host=' + host['hostname'] + '&port=' + host['port'] + '&core=' + host['core'];
    if(! $.isEmptyObject(host['auth'])) {
        retval += '&username=' + host['auth']['username'] + '&password=' + host['auth']['password'];
    }
    if(command === 'filelist') {
        retval += '&indexversion=' + host['details']['details']['indexVersion'];
    }
    return retval;
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
	if(command === 'reload') {
		if(D['solr_response_headers'][data['data']['responseHeader']['status']] === 'ok') {
	    	changeIcon(element_id, 'success');
	        setStatusBar('Success!', command, 'success', D['hide_status_msg_success']);
		} else {
			changeIcon(element_id, 'error');
	        setStatusBar(data['data'], command, 'error', D['hide_status_msg_error']);
		}
	} else if(command === 'filelist') {
		if (data['data']['filelist']) {
	        changeIcon(element_id, 'success');
	        setStatusBar('Success!', command, 'success', D['hide_status_msg_success']);
	        displayFilelist(data, host);
		} else {
			changeIcon(element_id, 'error');
	        setStatusBar(data['data']['status'], command, 'error', D['hide_status_msg_error']);
		}
	} else {
	    if(data['status'].toLowerCase() === 'error') {
	        changeIcon(element_id, 'error');
	        setStatusBar(data['data'], command, 'error', D['hide_status_msg_error']);
	    } else if(data['data']['status'].toLowerCase() === 'error') {
	        changeIcon(element_id, 'error');
	        setStatusBar(data['data']['message'], command, 'error', D['hide_status_msg_error']);
	    } else if(data['data']['status'].toLowerCase() == 'ok') {
	        changeIcon(element_id, 'success');
	        setStatusBar('Success!', command, 'success', D['hide_status_msg_success']);
	    } else {
	        changeIcon(element_id, 'error');
	        setStatusBar(data['data']['status'], command, 'error', D['hide_status_msg_error']);
	    }
	}
}

function displayFilelist(data, host) {
    toggleRefresh(false);
    var result = new EJS({'url': '/static/ejs/filelist.ejs'}).render({'data': data, 'host': host});
    var overlay_element = $('#filelist_overlay');
    overlay_element.html(result);
    $.modal(overlay_element);
    toggleRefresh(true);
}

function setStatusBar(text, command, css, hide_seconds) {
    /**
     * text: the status bar's html content
     * command: command that was executed
     * css: a css class to add
     * hide_seconds: hide the statusbar after n seconds
     * 
     */
    var bar = $('#statusbar');
    bar.removeAttr('style');
    bar.removeClass('hidden success error');
    bar.addClass(css);
    bar.html(command + ': ' + text);
    setTimeout(function() {
        bar.fadeOut('slow');
    }, hide_seconds * 1000);
}

function getExecuteButtonClass(command, det) {
    /**
     * Decides what CSS Classes to apply to buttons in the table, 
     * given the data the server returns. 
     */
    if(command === 'fetchindex') {
        if(det['isSlave'] === 'true') {
            if(det['slave']['isReplicating'] === 'true') {
                return 'working'
            } else if(det['slave']['isReplicating'] === 'false') {
                return 'ready';
            }
        } else {
            return 'hidden';
        }
    } else if(command === 'enablepoll') {
        if(det['isSlave'] === 'true') {
            if(det['slave']['isPollingDisabled'] === 'true') {
                return 'disabled';
            } else {
                return 'enabled';
            }
        } else {
            return 'hidden';
        }
    } else if(command === 'enablereplication') {
        if(det['isMaster'] === 'true') {
            if('master' in det) {
                if(det['master']['replicationEnabled'] === 'true') {
                    return 'enabled';
                } else {
                    return 'disabled';
                }
            } else {
                // Solr 1.4.1
                return 'ready';
            }
        } else {
            return 'hidden';
        }
    } else if(command === 'filelist') {
        return 'ready';
    } else if(command === 'backup') {
        return 'ready';
    }
}

function changeIcon(element_id, new_icon) {
    /**
     * element_id: id of the element that was clicked to trigger this function 
     * new_icon: a css class to be added to change the icon
     */
    var element = $('#' + element_id);
    if(!(element.hasClass('enabled') || element.hasClass('disabled')) 
       && new_icon !== 'error') { 
        element.removeClass('ready success error working');
        element.addClass(new_icon);
    } else if(new_icon === 'success') {
        if(element.hasClass('enabled')) {
            element.removeClass('enabled');
            element.addClass('disabled');
        } else {
            element.removeClass('disabled');
            element.addClass('enabled');
        }
    }
}

function upToDate(det) {
    return det['slave']['masterDetails']['indexVersion'] == det['indexVersion'];
}