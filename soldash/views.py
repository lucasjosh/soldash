from flask import render_template, request, jsonify

from soldash import app
from soldash.helpers import restart, get_details, query_solr
from soldash.settings import RESPONSEHEADERS, COMMANDS, JS_REFRESH, DEBUG

@app.route('/')
def homepage():
    indexes = get_details()
    return render_template('homepage.html', indexes=indexes, 
                           JS_REFRESH=JS_REFRESH, DEBUG=str(DEBUG).lower())

@app.route('/execute/<command>', methods=['POST'])
def execute(command):
    hostname = request.form['host']
    port = request.form['port']
    index = request.form['index']
    if command == 'restart':
        password = request.form.get('ssh_password','')
        return restart(hostname, port, password)
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
                    'commands': COMMANDS})
