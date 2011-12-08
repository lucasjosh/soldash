import copy
import urllib2
import simplejson
import socket

from flask import jsonify
from soldash.settings import HOSTS, CORES, TIMEOUT, DEFAULTCORENAME

def get_details():
    retval = []
    for core in CORES:
        entry = {'core_name': core, 
                 'hosts': copy.deepcopy(HOSTS)}
        for host in entry['hosts']:
            details = query_solr(host, 'details', core)
            if details['status'] == 'ok':
                host['details'] = details['data']
            elif details['status'] == 'error':
                host['details'] = None
                host['error'] = details['data']
        retval.append(entry)
    return retval

def get_solr_versions():
    retval = {}
    for host in HOSTS:
        url = 'http://%s:%s/solr/admin/system?wt=json' %(host['hostname'],
                                                         host['port'])
        system_data = query_solr(host, None, None, url=url)
        retval[host['hostname']] = system_data['lucene']['lucene-spec-version']
    return retval
    

def query_solr(host, command, core, params=None, url=None):
    socket.setdefaulttimeout(TIMEOUT)
    if not core:
        core = DEFAULTCORENAME
    
    if not url:
        if command == 'reload':
            url = 'http://%s:%s/solr/admin/cores?action=RELOAD&wt=json&core=%s' % (host['hostname'], 
                                                                                   host['port'],
                                                                                   core)
        else:
            url = 'http://%s:%s/solr/%s/replication?command=%s&wt=json' % (host['hostname'], 
                                                                           host['port'], 
                                                                           core,
                                                                           command)
    if params:
        for key in params:
            url += '&%s=%s' % (key, params[key])
    if host.get('auth', {}):
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