# Soldash

Soldash is a small web application that provides an overview of multiple Solr instances. 

It aims to be a fully functional dashboard, providing full control over your Solr architecture. 

## Features
* See an up-to-date overview of the state of all configured Solr instances, with attention drawn to slaves whose indexes are out of sync.
* Issue commands to fetch indexes, view file lists of index, restart solr instances and enable/disable polling and replication.
* Support for multi-core Solr clusters.

It is still very young software and may contain bugs. Any feedback should be sent to _opensource at edelight dot de_ and would be greatly appreciated.

## Getting Started
* Clone this git repository
* Install the necessary dependencies:
    * pip install flask
    * pip install fabric
* Edit settings.py according to your Solr setup. More details are provided below.
* Start the server:
    * python runserver.py
* Connect to http://localhost:5000 with a web browser

## settings.py configuration
settings.py contains a number of variables used by both the backend and frontend of Soldash. 

The variables you may need to configure are listed below.  

### HOSTS
The HOSTS variable is a list of hosts, each defined in a dictionary. An example entry for an instance of Solr running locally without HTTP authentication required would be:

    {'hostname': 'localhost', 
     'port': 8983, 
     'auth': {}}

If HTTP authentication were required by the Solr instance in the last example, the entry would look like this:

    {'hostname': 'localhost', 
     'port': 8983, 
     'auth': {'username': 'test', 'password': 'test'}}

### CORES
CORES is a list of the cores available on the Solr instances. At the moment, due to the primary requirements of this project, Soldash presumes that all Solr instances have the same cores.

If you do not have a multi-core set up, CORES should be defined so:

    CORES = [None]

If you have a default index and two additional cores, CORES should be defined so:

    CORES = [None, 'core1', 'core2']

### TIMEOUT
TIMEOUT is the timeout (in seconds) for queries to a Solr client. It is best to keep this number relatively low as requests are (not yet) parallelized.

### JS_REFRESH
JS_REFRESH defines how often (in seconds) a user's browser should refresh the data displayed on the page.

### HIDE_STATUS_MSG_SUCCESS
Defines how many seconds to wait before hiding a status message if it's being displayed by a successful command execution.

### HIDE_STATUS_MSG_ERROR
The same as the previous, only for an unsuccessful command execution.

### DEBUG
If enabled, the web application will be started in Flask's debug mode (allowing access to traceroutes, etc) and caching of the javascript templates will be disabled. 

### DEFAULTCORENAME
This is the name of your default core in a single-core setup. You can set or find out what this is by editing your
solr.xml file.
