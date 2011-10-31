from flask import render_template, request, jsonify

from soldash import app
from soldash.helpers import restart, get_details, query_solr
from soldash.settings import (RESPONSEHEADERS, COMMANDS, JS_REFRESH, 
                              DEBUG, HIDE_STATUS_MSG_SUCCESS, HIDE_STATUS_MSG_ERROR)

@app.route('/')
def homepage():
    indexes = get_details()
    return render_template('homepage.html', indexes=indexes)

@app.route('/execute/<command>', methods=['POST'])
def execute(command):
    hostname = request.form['host']
    port = request.form['port']
    if command == 'restart':
        username = request.form.get('ssh_username','')
        password = request.form.get('ssh_password','')
        return restart(hostname, port, username, password)
    
    index = request.form['index']
    if index in ['null', 'None']:
        index = None
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
    return jsonify(query_solr(host, command, index, params=params))

@app.route('/details', methods=['GET'])
def details():
    retval = get_details()
    return jsonify({'data': retval,
                    'solrResponseHeaders': RESPONSEHEADERS,
                    'commands': COMMANDS,
                    'js_refresh': JS_REFRESH,
                    'debug': str(DEBUG).lower(),
                    'hide_status_msg_success': HIDE_STATUS_MSG_SUCCESS,
                    'hide_status_msg_error': HIDE_STATUS_MSG_ERROR})
