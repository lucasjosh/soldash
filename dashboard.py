import urllib2
import simplejson

from flask import Flask, render_template


app = Flask(__name__)
COMMANDS = ['backup', 'fetchindex', 'enablepoll',
            'disablepoll', 'enablereplication', 'disablereplication',
            'details', 'filelist', 'abortfetch']
c = {}
c['responseHeaders'] = {0: 'ok'}
c['hosts'] = [{'hostname': 'localhost', 'port': 8983},
              {'hostname': '33.33.33.5', 'port': 8983},
              {'hostname': '33.33.33.10', 'port': 8983},
              {'hostname': '33.33.33.11', 'port': 8983}]


@app.route('/')
def homepage():
    initialise()
    return render_template('homepage.html', c=c)

def initialise():
    for host in c['hosts']:
        host['details'] = query_solr(host['hostname'], host['port'], 
                                     'details')

def query_solr(host, port, command, vals=None):
    if not command in COMMANDS:
        abort(501)
    url = 'http://%s:%s/solr/replication?command=%s&wt=json' % (host, port, command)
    if vals:
        for key in vals:
            url += '&%s=%s' % (key, vals[key])
    try:
        conn = urllib2.urlopen(url)
    except urllib2.URLError:
        return False
    return simplejson.load(conn)

if __name__ == '__main__':
    app.run(debug=True)