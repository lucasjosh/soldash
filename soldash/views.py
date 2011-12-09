from flask import render_template, request, jsonify

from soldash import app
from soldash.helpers import get_details, query_solr, get_solr_versions
from soldash.settings import (RESPONSEHEADERS, COMMANDS, JS_REFRESH, 
                              DEBUG, HIDE_STATUS_MSG_SUCCESS, HIDE_STATUS_MSG_ERROR)

@app.route('/')
def homepage():
    ''' Render and return the main homepage HTML. 
        
    This HTML will then be populated by javascript and EJS.
    '''
    cores = get_details()
    return render_template('homepage.html', cores=cores)

@app.route('/execute/<command>', methods=['POST'])
def execute(command):
    ''' Execute a command (one of soldash.settings.COMMANDS).
    
    Returns the output in JSON form.
    '''
    hostname = request.form['host']
    port = request.form['port']
    
    core = request.form['core']
    if core in ['null', 'None', 'undefined']:
        core = None
    auth = {}
    params = {}
    try:
        auth = {'username': request.form['username'],
                'password': request.form['password']}
    except KeyError, e:
        pass
    try:
        params = {'indexversion': request.form['indexversion']}
    except KeyError, e:
        pass
    host = {'hostname': hostname,
            'port': port,
            'auth': auth}
    return jsonify(query_solr(host, command, core, params=params))

@app.route('/solr_versions', methods=['GET'])
def solr_versions():
    ''' Get the versions of all Solr daemons configured in 
    soldash.settings.HOSTS.
    
    Returns the output in JSON form.
    '''
    
    return jsonify({'data': get_solr_versions()})

@app.route('/details', methods=['GET'])
def details():
    ''' Get details about the current state of all Solr instances.
    
    Returns the output in JSON form.
    '''
    retval = get_details()
    return jsonify({'data': retval,
                    'solr_response_headers': RESPONSEHEADERS,
                    'commands': COMMANDS,
                    'js_refresh': JS_REFRESH,
                    'debug': str(DEBUG).lower(),
                    'hide_status_msg_success': HIDE_STATUS_MSG_SUCCESS,
                    'hide_status_msg_error': HIDE_STATUS_MSG_ERROR})
