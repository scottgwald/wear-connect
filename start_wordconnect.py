import gevent.monkey
import signal
gevent.monkey.patch_all()
from gevent.event import Event
from gevent.event import AsyncResult
import gevent.subprocess as subprocess
import gevent

import re

from twisted.web.server import Site
from twisted.web.static import File 
from twisted.internet import reactor

from wearconnect import WearConnectServer 

HTTP_PORT = 8991
page_address = ('http://localhost:%d/' % HTTP_PORT)
the_greenlets = []
finish_called = False

webserver_running = Event()
window_is_ready = Event()
wcs_initialized = Event()
server_done_event = Event()
test_window_id = AsyncResult()

def start_web_server():
    reactor.listenTCP(HTTP_PORT, Site(File(".")));
    reactor.addSystemEventTrigger('after', 'shutdown', server_done)
    webserver_running.set()
    reactor.run()

def server_done():
    print("SERVER DONE EVENT")
    server_done_event.set()

def open_page():
    print("Opening first client")
    #
    # open in new window and grab the window id
    #
    p = subprocess.Popen(['chrome-cli', 'open', page_address, '-i'])
    p.wait()
    p1 = subprocess.Popen(['chrome-cli', 'list', 'windows'], stdout=subprocess.PIPE)
    #
    # 'out' contains window list. The last one is the new one.
    #
    out, err = p1.communicate()
    chrome_windows = out.split("\n")
    m = re.search('\[(?P<id>[0-9]+)\]', chrome_windows[-2])
    print("Found id of new window: %s" % m.group('id'))
    test_window_id.set(m.group('id'))
    window_is_ready.set()

def start_wearconnect():
    global wcs
    window_is_ready.wait()
    wcs = WearConnectServer()
    wcs_initialized.set()
    gevent.signal(signal.SIGTERM, finish)
    gevent.signal(signal.SIGINT, finish)

    wcs.run()

def close_page():
    print("Closing page.")
    p = subprocess.Popen(['chrome-cli', 'close', '-w', test_window_id.get()])

def kill_greenlets():
    cnt = 0
    for greenlet in the_greenlets:
        print "Killing greenlet " + str(cnt)
        gevent.kill(greenlet)
        cnt += 1

def finish():
    global finish_called
    if finish_called:
        print "Finished called multiple times."
        return

    print "Finishing."
    finish_called = True

    # shut down the web server
    reactor.stop()

    # close chrome window
    ##close_page()

    # kill everything
    server_done_event.wait()
    kill_greenlets()

if __name__ == '__main__':
    web_server_greenlet = gevent.spawn( start_web_server)
    the_greenlets.append( gevent.spawn( open_page) )
    the_greenlets.append( gevent.spawn( start_wearconnect ) )

    gevent.joinall( the_greenlets )
