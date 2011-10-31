import copy
import urllib2
import simplejson
import socket
import fabric.api as fabric

from flask import jsonify
from soldash.settings import HOSTS, INDEXES, TIMEOUT

def restart(hostname, port, username, password):
    fabric.env.host_string = hostname
    fabric.env.user = username
    fabric.env.password = password
    fabric.env.abort_on_errors = True
    try:
        retval = fabric.sudo('/etc/init.d/solr restart')
    except SystemExit as e:
        return jsonify({'result': 'Error: Could not connect to the solr instance'})
    except Exception as e:
        return jsonify({'result': 'Error: Unknown Error'})
    return jsonify({'result': retval})


def get_details():
    retval = []
    for index in INDEXES:
        entry = {'index_name': index, 
                 'hosts': copy.deepcopy(HOSTS)}
        for host in entry['hosts']:
            details = query_solr(host, 'details', index)
            if details['status'] == 'ok':
                host['details'] = details['data']
            elif details['status'] == 'error':
                host['details'] = None
                host['error'] = details['data']
        retval.append(entry)
    return retval

def query_solr(host, command, index, params=None):
    socket.setdefaulttimeout(TIMEOUT)
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