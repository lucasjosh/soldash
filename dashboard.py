import urllib2
import simplejson

from flask import Flask, render_template


app = Flask(__name__)
c = {}
c['responseHeaders'] = {0: 'ok'}
c['hosts'] = [{'hostname': 'localhost', 'port': 8983},
              {'hostname': '33.33.33.5', 'port': 8983},
              {'hostname': '33.33.33.10', 'port': 8983},
              {'hostname': '33.33.33.11', 'port': 8983}]
c['commands'] = [
                {'command': 'fetchindex', 'title': 'Fetch Index'},
                {'command': 'abortfetch', 'title': 'Abort Fetch'},
                {'command': 'enablepoll', 'title': 'Enable Polling'},
                {'command': 'disablepoll', 'title': 'Disable Polling'}, 
                {'command': 'enablereplication', 'title': 'Enable Replication'}, 
                {'command': 'disablereplication', 'title': 'Disable Replication'},
                {'command': 'details', 'title': False}, 
                {'command': 'filelist', 'title': 'File List'},
                {'command': 'backup', 'title': 'Backup'} 
            ]

@app.route('/')
def homepage():
    initialise()
    return render_template('homepage.html', c=c)

def initialise():
    for host in c['hosts']:
        host['details'] = query_solr(host['hostname'], host['port'], 
                                     'details')

def query_solr(host, port, command, vals=None):
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