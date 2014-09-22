import gevent.monkey
import signal
gevent.monkey.patch_all()
from gevent.event import Event
from gevent.event import AsyncResult
import gevent.subprocess as subprocess
import gevent
import base64
 
import re
 
from twisted.web.server import Site
from twisted.web.static import File 
from twisted.internet import reactor
 
from wearconnect import WearConnectServer 
 
HTTP_PORT = 8991
WS_PORT = 8112
page_address = ('http://localhost:%d/' % HTTP_PORT)
the_greenlets = []
finish_called = False
clientGroup = 'python_client'
audioDevice = 'audio'
 
webserver_running = Event()
window_is_ready = Event()
wcs_initialized = Event()
server_done_event = Event()
ready_for_audio = Event()
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
    webserver_running.wait()
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
 
def callback_audio(ws, **kw):
    def narrowcast_cb(chan, *argv):
        print "Narrowcast callback " + chan
 
    def get_test_channel(chan, data, filename):
        global messages_received
        global total_transit_time
        #### Write the file to the file system,
        #### When done, publish to audioRead or something liket that
        send_time = datetime.strptime(timestamp, time_format_string)
        recv_time = datetime.today()
        transit_time = recv_time - send_time
        total_transit_time += transit_time
        base64data=data[data.find(',')+1:]
        binary_data = base64.b64decode(base64data)
        f = open('binary', 'w')
        f.write(binary_data)
        f.close()
        ws.publish('publishAudio','0.0.0.0:8080/binary')
        print "Transit time: %s. Bob got message on channel %s of length %s at time %s" % (str(transit_time), chan, str(len(data)), str(recv_time))
        messages_received += 1
 
    print "I'm Audio and my group_device is " + ws.group_device
    ws.subscribe(ws.group_device, narrowcast_cb)
    ws.subscribe('saveAudio', get_test_channel)
    ready_for_audio.set()
    ws.handler_loop()
 
def start_audio_handler():
    wcs_initialized.wait()
    wcs.public_ready.wait()
    print("Starting Audio Handler.")
    wearscript.websocket_client_factory(
        callback_audio,
        'ws://localhost:' + str(WS_PORT) + '/', 
        group = clientGroup,
        device = audioDevice
    )
 
 
 
if __name__ == '__main__':
    web_server_greenlet = gevent.spawn( start_web_server)
    the_greenlets.append( gevent.spawn( open_page) )
    the_greenlets.append( gevent.spawn( start_wearconnect ) )
    the_greenlets.append( gevent.spawn( start_audio_handler ) )
 
    gevent.joinall( the_greenlets )
