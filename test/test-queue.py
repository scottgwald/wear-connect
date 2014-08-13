import gevent.monkey
gevent.monkey.patch_all()
import wearscript
import argparse
from .. import wear_connect_server
import time
from apscheduler.schedulers.gevent import GeventScheduler as Scheduler
import logging
from time import sleep
import sys
from datetime import datetime
from datetime import timedelta
from Queue import Queue

image_name_templ = 'wear-connect/test/img/text-wear-connect-test-%s.jpg'
# TODO: this needs to be in only one place!!
WS_PORT = 8112
number_of_messages = 200
number_of_test_images = 10
delta_to_start = 1
delta_between_messages = 0.01
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
last_queue_time = ""

def image_name(i):
    return image_name_templ % (str(i).zfill(3))

def load_image_data(i):
    file_path = image_name(i)
    img = open(file_path, 'rb')
    img.seek(0)
    imgBytes = img.read()
    img.close()
    return imgBytes

print("Bytes in image: " + str(len(load_image_data(0))))

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
    try:
        ws.handler_loop()
    except Exception:
        print "Looks like Alice's websocket broke! Sad face. Finishing"
        finish()

def callback_bob(ws, **kw):

    def narrowcast_cb(chan, *argv):
        print "Narrowcast callback " + chan

    def get_test_channel(chan, arg1, arg2):
        global messages_received
        send_time = datetime.strptime(arg2, time_format_string)
        recv_time = datetime.today()
        transit_time = recv_time - send_time
        print "Transit time: %s. Bob got message on channel %s of length %s at time %s" % (str(transit_time), chan, str(len(arg1)), str(datetime.today()))
        messages_received += 1

    print "I'm Bob and my group_device is " + ws.group_device
    ws.subscribe( ws.group_device, narrowcast_cb )
    ws.subscribe( test_channel, get_test_channel )
    ws.handler_loop()

def scheduler_loop(arg):
    global sched
    sched = Scheduler()
    sched.start()
    logging.basicConfig()
    scheduler_main("")
    while True:
        sleep( 1 )
        sys.stdout.write( '.' )
        sys.stdout.flush()

def do_process_queue():
    global messages_published
    global msg_queue
    msg_queue = Queue()
    print "Starting queue processing yay 8987987"
    while True:
        msg_args = msg_queue.get()
        is_last_message = msg_args[-1] == last_queue_time
        time_here = str(datetime.today())
        msg_args[-1] = time_here
        try:
            ws_alice.publish(*msg_args)
            messages_published += 1
        except AssertionError:
            print "AssertionError: skipping publish."
        except Exception:
            print "Exception raised in ws_alice publish"
        msg_queue.task_done()
        if is_last_message:
            "Processing the last message."
            finish()

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
        msg_queue.put([test_subchannel, msgBytes, time_here])
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

    # wait a few seconds for running jobs to finish
    delayed_finish()

def delayed_finish():
    final_sched = Scheduler()
    final_sched.start()
    now = datetime.today()
    deltaFinal = timedelta( seconds = final_wait )
    starttime = now + deltaFinal
    final_sched.add_job( final_finish, 'date', run_date = starttime, args= [ ] )
    # final_sched.shutdown()

def final_finish():
    kill_greenlets()
    final_report()

def kill_greenlets():
    cnt = 0
    for greenlet in the_greenlets:
        print "Trying to kill a greenlet " + str(cnt)
        gevent.kill(greenlet)
        cnt += 1

def final_report():
    print "Final report: messages queued %i, messages published %i, messages received %i" % (messages_queued, messages_published, messages_received)

def scheduler_main(arg):

    now = datetime.today()
    print "Now it's " + str( now )
    starttime = now + timedelta( seconds = delta_to_start )
    delta5sec = timedelta( seconds = delta_between_messages )
    # deltaFinal = timedelta( seconds = final_wait )
    thistime = starttime

    jobs = []
    print "Queueing jobs"
    for i in range( number_of_messages ):
        print "Queueing job at " + str( thistime )
        jobs.append( sched.add_job( queue_test_message, 'date', run_date = thistime, args= [ i ] ))
        thistime += delta5sec

def start_ws_client_alice():
    wearscript.websocket_client_factory( callback_alice, 'ws://localhost:' + str(WS_PORT) + '/', 
        group = clientGroup, device = aliceDevice )
    # wearscript.websocket_client_factory( callback_alice, 'ws://localhost:' + str(WS_PORT) + '/')

def start_ws_client_bob():
    wearscript.websocket_client_factory( callback_bob, 'ws://localhost:' + str(WS_PORT) + '/', 
        group = clientGroup, device = bobDevice )
    # wearscript.websocket_client_factory( callback_bob, 'ws://localhost:' + str(WS_PORT) + '/')

def start_ws_server():
    wear_connect_server.main()

if __name__ == '__main__':
    # fire up wear-connect server, client bob, and client alice
    ws_server_greenlet = gevent.spawn(start_ws_server)
    ws_client_greenlet_bob = gevent.spawn_later(2, start_ws_client_bob)
    ws_client_greenlet_alice = gevent.spawn_later(3, start_ws_client_alice)

    # schedule test messages from client Alice
    scheduler_loop_greenlet = gevent.spawn_later(6, scheduler_loop, "")
    do_process_queue_greenlet = gevent.spawn(do_process_queue)

    print "Spawned Greenlets: ws_server_greenlet, ws_client_greenlet_alice, " \
        +  "ws_client_greenlet_bob, scheduler_loop_greenlet"
    the_greenlets = [ws_server_greenlet, ws_client_greenlet_alice, ws_client_greenlet_bob, scheduler_loop_greenlet, do_process_queue_greenlet]
    gevent.joinall(the_greenlets)
