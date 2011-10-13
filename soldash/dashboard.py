import urllib
import urllib2
import simplejson
import socket

from flask import Flask, render_template, request, jsonify

from settings import c

app = Flask(__name__)

@app.route('/')
def homepage():
    indexes = initialise()
    return render_template('homepage.html', indexes=indexes, c=c)

@app.route('/execute/<command>', methods=['POST'])
def execute(command):
    hostname = request.form['host']
    port = request.form['port']
    index = request.form['index']
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
    return jsonify(query_solr(host, command, index, params=params))

@app.route('/refresh', methods=['GET'])
def refresh():
    initialise()
    return jsonify(c)

def initialise():
    retval = {}
    for index in c['indexes']:
        retval[index] = []
        for host in c['hosts']:
            details = query_solr(host, 'details', index)
            if details['status'] == 'ok':
                host['details'] = details['data']
            elif details['status'] == 'error':
                host['details'] = None
                host['error'] = details['data']
            retval[index].append(host)
    return retval

def query_solr(host, command, index, params=None):
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
                  'data': 'auth'}
    except urllib2.URLError, e:
        retval = {'status': 'error', 
                  'data': 'down'}
    print str(retval)
    return retval

if __name__ == '__main__':
    app.run(debug=True)