import copy
import urllib
import urllib2
import simplejson
import socket
import fabric.api as fabric

from flask import Flask, render_template, request, jsonify

from settings import c, HOSTS, INDEXES, SSH_USERNAME, SSH_PASSWORD

app = Flask(__name__)

@app.route('/')
def homepage():
    indexes = _get_details()
    return render_template('homepage.html', indexes=indexes, c=c)

@app.route('/execute/<command>', methods=['POST'])
def execute(command):
    hostname = request.form['host']
    port = request.form['port']
    index = request.form['index']
    if command == 'restart':
        return _restart(hostname, port)
    if index == 'null':
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
    return jsonify(_query_solr(host, command, index, params=params))

def _restart(hostname, port):
    fabric.env.host_string = hostname
    fabric.env.user = SSH_USERNAME
    fabric.env.password = SSH_PASSWORD
    retval = fabric.sudo('/etc/init.d/solr restart')
    return jsonify({'result': retval})

def _get_details():
    retval = {}
    for index in INDEXES:
        retval[index] = copy.deepcopy(HOSTS)
        for host in retval[index]:
            details = _query_solr(host, 'details', index)
            if details['status'] == 'ok':
                host['details'] = details['data']
            elif details['status'] == 'error':
                host['details'] = None
                host['error'] = details['data']
    return retval

def _query_solr(host, command, index, params=None):
    socket.setdefaulttimeout(2)
    if index:
        url = 'http://%s:%s/solr/%s/replication?command=%s&wt=json' % (host['hostname'], 
                                                                       host['port'], 
                                                                       index,
                                                                       command)
    else:
        url = 'http://%s:%s/solr/replication?command=%s&wt=json' % (host['hostname'], 
                                                                    host['port'], 
                                                                    command)
    if params:
        for key in params:
            url += '&%s=%s' % (key, params[key])
    if host['auth']:
        passman = urllib2.HTTPPasswordMgrWithDefaultRealm()
        passman.add_password(None, url, 
                             host['auth']['username'], 
                             host['auth']['password'])
        auth_handler = urllib2.HTTPBasicAuthHandler(passman)
        opener = urllib2.build_opener(auth_handler)
        urllib2.install_opener(opener)
    try:
        conn = urllib2.urlopen(url)
        retval = {'status': 'ok', 
                  'data': simplejson.load(conn)}
    except urllib2.HTTPError, e:
        retval = {'status': 'error',
                  'data': 'conf'}
    except urllib2.URLError, e:
        retval = {'status': 'error', 
                  'data': 'down'}
    return retval

if __name__ == '__main__':
    app.run(debug=True)
