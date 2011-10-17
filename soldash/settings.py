HOSTS = [
                 {'hostname': 'localhost', 
                  'port': 8983, 
                  'auth': {}},
                 {'hostname': '33.33.33.10', 
                  'port': 8983,
                  'auth': {'username': 'test', 'password': 'test'}},
                 {'hostname': '33.33.33.11', 
                  'port': 8983,
                  'auth': {'username': 'test', 'password': 'test'}},
                 {'hostname': '33.33.33.12', 
                  'port': 8983,
                  'auth': {'username': 'test', 'password': 'test'}}
             ]
INDEXES = [None]

SSH_USERNAME = 'vagrant'

TIMEOUT = 2

c = {}
c['responseHeaders'] = {0: 'ok'}
c['commands'] = [
                    {'command': 'fetchindex', 'title': 'Fetch Index', 'reverse': 'abortfetch'},
                    {'command': 'enablepoll', 'title': 'Enable Polling', 'reverse': 'disablepoll'},
                    {'command': 'enablereplication', 'title': 'Enable Replication', 'reverse': 'disablereplication'}, 
                    {'command': 'details', 'title': False}, 
                    {'command': 'filelist', 'title': 'File List'},
                    {'command': 'backup', 'title': 'Backup'},
                    {'command': 'restart', 'title': 'Restart Solr'}
                ]