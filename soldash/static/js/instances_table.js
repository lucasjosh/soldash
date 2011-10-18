function initialise() {
    /**
     * Load data, re-load data every 3 seconds.
     */
    update();
    setInterval('update()', 3000);
}

function update() {
    $.ajax({
        url: '/details',
        type: 'GET',
        data: '',
        success: function(data, status, jqXHR){
            D = data['data'];
            EJS.config({cache: false});
            var result = new EJS({'url': '/static/ejs/homepage.ejs'}).render(data);
            document.getElementById('EJS_container').innerHTML = result;
            /*var instances_tables = $('.instances');
            for(var i=0; i<instances_tables.length; i++) {
                compareSlaveVersionsWithMaster(instances_tables[i].id);
            } */
            setupClickHandlers();
        }
    });
}

function setupClickHandlers() {
	/**
	 * Assign click handlers to all buttons.
	 */
    $('.executebutton').click(function() { 
        var id = idConverter($(this)[0].id);
        var host = getHostFromID(id);
        host['index'] = id[0];
        var command = id[3];
        if($(this).attr('class').indexOf('enabled') > 0) { 
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
    for(var i=0; i<D.length; i++) {
        var index = D[i];
        if(!index['index_name'] == id[0]) {
            break;
        }
        for(var j=0; j<index['hosts'].length; j++) {
            var host = index['hosts'][j];
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
        retval = [data[0],data[1].replace(/\./g,'_'),data[2],data[3],data[4]].join('-');
    }
    return retval;
}

function command_click(command, host, element_id) {
    /**
     * command: solr command to be executed
     * host: of the form 
     *   {hostname: 'localhost', port: 8888, auth: {username: 'abc', password: 'def'}, index: 'indexname'}
     * element_id: id of the element that was clicked to trigger this function
     */
    changeIcon(element_id, 'working');
    data = getSupportingPOSTData(command, host, element_id);
    console.log('supporting data');
    console.log(data);
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
	x = host;
    var retval = 'host=' + host['hostname'] + '&port=' + host['port'] + '&index=' + host['index'];
    if(! $.isEmptyObject(host['auth'])) {
        retval += '&username=' + host['auth']['username'] + '&password=' + host['auth']['password'];
    }
    if(command === 'filelist') {
        retval += '&indexversion=' + getIndexVersionFromElementID(element_id);
    } else if (command === 'restart') {
        var password = window.prompt('Please enter SSH password to restart Solr:','');
        retval += '&ssh_password=' + password;
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
    console.log(data);
    if(data['status'] == 'error') {
    	changeIcon(element_id, 'error');
        setStatusBar(data['data'], 'error', 5);
    } else if(data['data']['status'] == 'ERROR') {
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
        	console.log(det);
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
            console.log(det);
        	return 'ready';
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
    $('#' + element_id).removeClass('ready success error working');
    $('#' + element_id).addClass(new_icon);
}

function upToDate(det) {
	return det['slave']['masterDetails']['indexVersion'] == det['indexVersion'];
}