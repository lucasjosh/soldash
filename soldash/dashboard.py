import urllib
import urllib2
import simplejson

from flask import Flask, render_template, request, jsonify

from settings import c

app = Flask(__name__)

@app.route('/')
def homepage():
    initialise()
    return render_template('homepage.html', c=c)

@app.route('/execute/<command>', methods=['GET'])
def execute(command):
    host = request.args.get('host','')
    port = request.args.get('port','')
    return jsonify(query_solr(host, port, command))

def initialise():
    for host in c['hosts']:
        host['details'] = query_solr(host['hostname'], host['port'], 
                                     'details')

def parse_address(address):
    return address.split('%3A')

def query_solr(host, port, command, params=None):
    url = 'http://%s:%s/solr/replication?command=%s&wt=json' % (host, port, command)
    if params:
        for key in params:
            url += '&%s=%s' % (key, params[key])
    try:
        conn = urllib2.urlopen(url)
    except urllib2.URLError:
        return False
    return simplejson.load(conn)

if __name__ == '__main__':
    app.run(debug=True)