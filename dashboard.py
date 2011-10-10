import urllib2
import simplejson

from flask import Flask, render_template

from settings import c

app = Flask(__name__)

@app.route('/')
def homepage():
    initialise()
    return render_template('homepage.html', c=c)

def initialise():
    for host in c['hosts']:
        host['details'] = query_solr(host['hostname'], host['port'], 
                                     'details')

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