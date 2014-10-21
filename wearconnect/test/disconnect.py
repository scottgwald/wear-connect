# TEST RAPID DISCONNECT / RECONNECT
# Starting with a tame test where the next connect waits for the previous
# disconnect to finish

import gevent.monkey
gevent.monkey.patch_all()
from twisted.web.server import Site
from twisted.web.static import File 
from twisted.internet import reactor 
import gevent.subprocess as subprocess
import wearscript
import argparse
import os
# from .. import wear_connect_server
from wearconnect.wearconnect import WearConnectServer

import time
from apscheduler.schedulers.gevent import GeventScheduler as Scheduler
import logging
from time import sleep
import sys
from datetime import datetime
from datetime import timedelta
from Queue import Queue
from gevent.queue import Queue as GQueue
from gevent.event import Event
from gevent.event import AsyncResult
# from Queue import Queue
import base64
import re
import platform

# WHAT'S NEXT
# DO PROCESS QUEUE NEEDS TO SUPPORT CONNECT / DISCONNECT

def os_detector():
    uname = platform.uname()
    if uname[0] == 'Darwin' and uname[-2] == 'x86_64':
        return 'osx'
    elif uname[0] == 'Linux' and uname[-2] == 'x86_64':
        return 'linux64'
    elif uname[0] == 'Windows':
        return 'windows'
    return 'other'

THIS_OS = os_detector()

TEST_DIR = os.path.dirname(os.path.realpath(__file__))
image_name_templ = os.path.join(TEST_DIR, 'img','text-wear-connect-test-%s.jpg')
# TODO: this needs to be in only one place!!
WS_PORT = 8112
# this is only relevant with tile_windows = False. Else controlled by tile_x, tile_y
number_of_clients = 1
number_of_messages = 6
number_of_tasks = 20
number_of_test_images = 5
delta_to_start = 1
delta_between_messages = 0.2
final_wait = 3
clientGroup = 'python_client'
aliceDevice = 'alice'
bobDevice = 'bob'
ws_alice = ""
test_channel = 'image'
test_subchannel = test_channel + ':alice'
time_format_string = "%Y-%m-%d %H:%M:%S.%f"
the_greenlets = []
finish_called = False
messages_sent = 0
messages_queued = 0
messages_published = 0
messages_received = 0
tasks_published = 0
tasks_queued = 0
last_queue_time = ""
total_transit_time = timedelta( seconds = 0 )
giant_message = False
giant_message_doubling_exponent = 7
log_outfile_name = "playback.log"
LOG_OUTFILE = open(log_outfile_name, 'w+b')
HTTP_PORT = 8991
base64_encode_image = False
# BUG: tile_windows = False is broken
tile_windows = True

tile_x = [0]
tile_y = [20]
TILE_WIDTH = 800
TILE_HEIGHT = 800
# tile_x = [0, 400]
# tile_y = [20, 420]
# TILE_WIDTH = 400
# TILE_HEIGHT = 400
tile_number_of_rows = len(tile_y)
tile_number_of_columns = len(tile_x)
tile_number_of_clients = tile_number_of_rows * tile_number_of_columns # fixed for now
test_window_id = AsyncResult()

webserver_running = Event()
windows_are_open = Event()
windows_are_ready = Event()
ready_for_alice = Event()
wcs_initialized = Event()
ready_for_bob = Event()
ready_for_scheduler = Event()
ready_for_queue = Event()
page_address = ('http://localhost:%d/' % HTTP_PORT)
window_id_queue = GQueue()
window_pos_queue = GQueue()
window_info = []
wcs = ""

def queue_window_params():
    for x in tile_x:
        for y in tile_y:
            window_pos_queue.put([x, y])

def open_pages():
    webserver_running.wait()
    if tile_windows:
        open_tile_pages()
    else:
        for client_number in range(number_of_clients):
            gevent.spawn(open_page, client_number)

def open_tile_pages():
    queue_window_params()
    for client_number in range(tile_number_of_clients):
        gevent.spawn(open_page_id)
    gevent.spawn(arrange_tile_pages)

def close_tile_pages():
    if THIS_OS == 'osx':
        for params in window_info:
            p = subprocess.Popen(['chrome-cli', 'close', '-w', params['id']])

def arrange_tile_pages():
    global window_info
    window_greenlets = [];
    windows_are_open.wait()
    print("Windows are ready, yay!")
    if THIS_OS == 'osx':
        while not window_id_queue.empty():
            params = window_id_queue.get()
            #
            # SET POSITION
            #
            p = subprocess.Popen(['chrome-cli', 'position', params['x'], params['y'], '-w', params['id']])
            window_greenlets.append(p)
            p.wait()
            #
            # SET SIZE
            #
            p = subprocess.Popen(['chrome-cli', 'size', params['w'], params['h'], '-w', params['id']])
            window_greenlets.append(p)
            window_info.append(params)
            gevent.sleep(0)
        gevent.wait(window_greenlets)
    windows_are_ready.set()


def open_page_id():
    # parse tab id from command output and subtract 1 to get window id
    if THIS_OS == 'osx':
        chrome_cli_output = subprocess.check_output(['chrome-cli', 'open', page_address, '-i'])
        top_line = chrome_cli_output.split("\n")[0]
        m = re.search( '(?P<id>[0-9]+)', top_line )
        window_id = str(int(m.group('id')) - 1 )
        x,y = window_pos_queue.get()
        window_id_queue.put( {'id': window_id, 'x': str(x), 'y': str(y), 'w': str(TILE_WIDTH), 'h': str(TILE_HEIGHT) } )
    elif THIS_OS == 'windows':
        p = subprocess.Popen([os.path.join("C:\\", "Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"), page_address, "-i"])
        p.wait()
        window_id_queue.put({})
    else:
        p = subprocess.Popen(['google-chrome', '--incognito', page_address])
        p.wait()
        window_id_queue.put({})
    if window_id_queue.qsize() >= tile_number_of_clients:
        windows_are_open.set()

def open_page(client_number):
    if THIS_OS == 'osx':
        if client_number == 0:
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
        else:
            print("Opening client %i" % client_number)
            p = subprocess.Popen(['chrome-cli', 'open', page_address, '-w', test_window_id.get()])
    else:
        p = subprocess.Popen(['google-chrome', '--incognito', page_address])
        p.wait()

def start_web_server():
    reactor.listenTCP(HTTP_PORT, Site(File(TEST_DIR)));
    webserver_running.set()
    reactor.run()

def image_name(i):
    return image_name_templ % (str(i).zfill(3))

def load_image_data(i):
    file_path = image_name(i)
    img = open(file_path, 'rb')
    img.seek(0)
    imgBytes = img.read()
    # print "imgBytes " + imgBytes
    img.close()
    if giant_message and i % number_of_test_images == number_of_test_images - 1:
        print("Prepping a giant message")
        for i in range(giant_message_doubling_exponent):
            imgBytes += imgBytes
    if base64_encode_image:
        imgBytes = base64.b64encode(imgBytes)
    return imgBytes

# Goal: Clearly demonstrate a clogged websocket by sending a bunch of images 
# and showing that they occasionally take many seconds to arrive. Could try
# having Alice and Bob python clients, although I suspect that it is less
# likely to happen there than between a python client and the chrome browser.
# Let's find out! Start out with the same Alice-Bob setup, but send big images. 

def callback_alice(ws, **kw):
    global ws_alice
    ws_alice = ws
    # print "Client client_endpoint: " + str(ws.ws.sock.getpeername())

    def narrowcast_cb(chan, *argv):
        print "Narrowcast callback " + chan

    def subscriptions_cb(chan, groupDevice, channels):
        print "Alice knows: " + str(ws.device_to_channels)

    # print "I'm Alice and my websocket might not look right: " + str(ws)
    # print dir(ws)
    # print ws.group_device
    print "I'm Alice and my group_device is " + ws.group_device
    ws.subscribe( ws.group_device, narrowcast_cb )
    ws.subscribe( test_channel, narrowcast_cb )
    ws.subscribe( 'subscriptions', subscriptions_cb )
    ready_for_scheduler.set()
    try:
        ws.handler_loop()
    except Exception:
        print "Alice is disconnected."
        # finish()

def callback_bob(ws, **kw):
    def narrowcast_cb(chan, *argv):
        print "Narrowcast callback " + chan

    def get_test_channel(chan, timestamp, image):
        global messages_received
        global total_transit_time
        send_time = datetime.strptime(timestamp, time_format_string)
        recv_time = datetime.today()
        transit_time = recv_time - send_time
        total_transit_time += transit_time
        print "Transit time: %s. Bob got message on channel %s of length %s at time %s" % (str(transit_time), chan, str(len(image)), str(datetime.today()))
        messages_received += 1

    print "I'm Bob and my group_device is " + ws.group_device
    ws.subscribe( ws.group_device, narrowcast_cb )
    ws.subscribe( test_channel, get_test_channel )
    print "Ready for an Alice."
    ready_for_alice.set()
    ws.handler_loop()

def scheduler_loop(arg):
    global sched
    ready_for_scheduler.wait()
    print("STARTING SCHEDULER.")
    sched = Scheduler()
    sched.start()
    logging.basicConfig()
    scheduler_main("")
    ready_for_queue.set()
    while True:
        sys.stdout.write( '.' )
        sys.stdout.flush()
        gevent.sleep(1)

def do_process_queue():
    global messages_published
    global msg_queue
    ready_for_queue.wait()
    msg_queue = Queue()
    print "Starting queue processing yay 8987987"
    while True:
        msg_args = msg_queue.get()
        is_last_message = msg_args[1] == last_queue_time
        time_here = datetime.today()
        time_here_str = str(time_here)
        msg_args[1] = time_here_str
        try:
            ws_alice.publish(*msg_args)
            messages_published += 1
        except AssertionError:
            print "AssertionError: skipping publish."
        except Exception:
            print "Exception raised in ws_alice publish"
        print("Time to process queue item: %s" % (datetime.today() - time_here))
        msg_queue.task_done()
        if is_last_message:
            print(dir(ws_alice.ws))
            ws_alice.ws.close()
            "Processing the last message."
            finish()
        gevent.sleep(0)

def do_process_task_queue():
    global tasks_published
    global task_queue
    ready_for_queue.wait()
    task_queue = Queue()
    print "Starting queue processing yay 8987987"
    while True:
        task_args = task_queue.get()
        is_last_task = task_args[1] == last_queue_time
        time_here = datetime.today()
        time_here_str = str(time_here)
        task_args[1] = time_here_str
        if task_args[2] == 'connect':
            print "Starting an Alice"
            # connect
            gevent.spawn( start_ws_client_alice )
        elif task_args[2] == 'disconnect':
            print "Closing an Alice"
            gevent.spawn( close_ws_client_alice )
        else:
            try:
                print "Unexpected argument for task: " + task_args[2]
            except:
                print "Unexpected argument for task (not a string)."

        print("Time to process queue item: %s" % (datetime.today() - time_here))
        task_queue.task_done()
        if is_last_task:
            print "Last task, finishing."
            finish()
        gevent.sleep(0)

# Test task is disconnect / reconnect
def queue_test_task(i_orig):
    global tasks_queued
    global last_queue_time
    time_here = str(datetime.today())
    if i_orig % 2 == 0:
        # connect
        task_queue.put([test_subchannel, time_here, 'disconnect'])
    else:
        task_queue.put([test_subchannel, time_here, 'connect'])
        # disconnect
    tasks_queued += 1
    if i_orig == number_of_tasks - 1:
        print "Queuing the last message!!"
        last_queue_time = time_here        

def queue_test_message(i_orig):
    global messages_queued
    global last_queue_time
    time_here = str(datetime.today())
    i = i_orig % number_of_test_images
    msgBytes = load_image_data(i)
    print "Sending message to test channel %s at %s" %(test_channel, time_here)
    if i_orig == number_of_messages - 1:
        print "Queuing the last message!!"
        last_queue_time = time_here
    try:
        # add new message to the queue
        msg_queue.put([test_subchannel, time_here, msgBytes])
        messages_queued += 1
    except AssertionError:
        print "AssertionError: skipping publish."
    except Exception:
        print "Exception raised in ws_alice publish"

def finish():
    global finish_called
    if finish_called:
        print "Finished called multiple times."
        return

    print "Finishing."
    finish_called = True

    # shut down the scheduler right away
    sched.shutdown(wait=False)

    # shut down the web server
    reactor.stop()

    # close chrome windows
    if tile_windows:
        close_tile_pages()

    # wait a few seconds for running jobs to finish
    delayed_finish()

def delayed_finish():
    global final_sched
    final_sched = Scheduler()
    final_sched.start()
    now = datetime.today()
    deltaFinal = timedelta( seconds = final_wait )
    starttime = now + deltaFinal
    final_sched.add_job( final_finish, 'date', run_date = starttime, args= [ ] )
    # final_sched.shutdown()

def final_finish():
    final_sched.shutdown( wait = False )
    kill_greenlets()
    final_report()

def kill_greenlets():
    cnt = 0
    for greenlet in the_greenlets:
        print "Trying to kill a greenlet " + str(cnt)
        gevent.kill(greenlet)
        cnt += 1

def final_report():
    global messages_received
    if messages_received == 0:
        messages_received = 1
    print """
    Final report: tasks queued %i, messages published %i, messages received %i, average transit time %s
    """ % (tasks_queued, messages_published, messages_received, str(total_transit_time / messages_received))

def scheduler_main(arg):

    now = datetime.today()
    print "Now it's " + str( now )
    starttime = now + timedelta( seconds = delta_to_start )
    delta5sec = timedelta( seconds = delta_between_messages )
    # deltaFinal = timedelta( seconds = final_wait )
    thistime = starttime

    jobs = []
    print "Queueing jobs"
    for i in range( number_of_tasks ):
        print "Queueing job at " + str( thistime )
        jobs.append( sched.add_job( queue_test_task, 'date', run_date = thistime, args= [ i ] ))
        thistime += delta5sec
        gevent.sleep(0)

def start_ws_client_alice():
    ready_for_alice.wait()
    print("STARTING ALICE")
    wearscript.websocket_client_factory( callback_alice, 'ws://localhost:' + str(WS_PORT) + '/', 
        group = clientGroup, device = aliceDevice )
    ready_for_alice.clear()
    # wearscript.websocket_client_factory( callback_alice, 'ws://localhost:' + str(WS_PORT) + '/')

def close_ws_client_alice():
    try:
        ws_alice.ws.close()
        print("Ready for another Alice.")
        ready_for_alice.set()
    except:
        "Couldn't close Alice: ", sys.exc_info()[0]

def start_ws_client_bob():
    wcs_initialized.wait()
    wcs.public_ready.wait()
    # ready_for_bob.wait()
    print("STARTING BOB.")
    wearscript.websocket_client_factory( callback_bob, 'ws://localhost:' + str(WS_PORT) + '/', 
        group = clientGroup, device = bobDevice )
    # wearscript.websocket_client_factory( callback_bob, 'ws://localhost:' + str(WS_PORT) + '/')

def start_ws_server():
    windows_are_ready.wait()
    print("WINDOWS ARE READY. STARTING WS SERVER.")
    return wear_connect_server.main()

def start_everybody_else():
    uber_client_ready.wait()
    ready_for_alice.set()
    ready_for_bob.set()
    ready_for_scheduler.set()

def start_wearconnect():
    global wcs
    windows_are_ready.wait()
    wcs = WearConnectServer()
    wcs_initialized.set()
    wcs.run()

def return_a_value():
    return "my badass value"

def event_test():
    wcs.uber_client_ready.wait()
    print("Got uber_client_ready event!")

def moving_forward():
    wcs.public_ready.wait()
    print("WearConnectServer is ready for action.")

if __name__ == '__main__':
    the_greenlets.append( gevent.spawn( start_web_server) )
    the_greenlets.append( gevent.spawn( open_pages) )
    the_greenlets.append( gevent.spawn( start_wearconnect ) )
    the_greenlets.append( gevent.spawn( start_ws_client_bob ) )
    the_greenlets.append( gevent.spawn( start_ws_client_alice ) )
    the_greenlets.append( gevent.spawn( scheduler_loop, "" ) )
    the_greenlets.append( gevent.spawn( do_process_task_queue ) )

    gevent.joinall( the_greenlets )
    # gevent.wait()

