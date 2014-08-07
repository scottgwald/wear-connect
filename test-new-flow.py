import gevent.monkey
gevent.monkey.patch_all()
import wearscript
import argparse
import glassprov_server_new
import time
from apscheduler.scheduler import Scheduler
import logging
from time import sleep
import sys
from datetime import datetime
from datetime import timedelta

# TODO: this needs to be in only one place!!
WS_PORT = 8112
number_of_messages = 5
delta_to_start = 1
delta_between_messages = 2
clientGroup = 'python_client'
aliceDevice = 'alice'
bobDevice = 'bob'
ws_alice = ""
test_channel = 'test_channel'

def callback_alice(ws, **kw):
    global ws_alice
    ws_alice = ws
    # print "Client client_endpoint: " + str(ws.ws.sock.getpeername())

    def narrowcast_cb(chan, *argv):
        print "Narrowcast callback " + chan

    # print "I'm Alice and my websocket might not look right: " + str(ws)
    # print dir(ws)
    # print ws.group_device
    print "I'm Alice and my group_device is " + ws.group_device
    ws.subscribe( ws.group_device, narrowcast_cb )
    ws.subscribe( test_channel, narrowcast_cb )
    ws.handler_loop()

def callback_bob(ws, **kw):

    def narrowcast_cb(chan, *argv):
        print "Narrowcast callback " + chan

    def get_test_channel(chan, arg1, arg2):
        print "Bob got %s on channel %s" % (arg1, chan)

    print "I'm Bob and my group_device is " + ws.group_device
    ws.subscribe( ws.group_device, narrowcast_cb )
    ws.subscribe( 'test_channel', get_test_channel )
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

def send_test_message(time):
    time_here = str(time)
    print "Sending message to test channel %s at %s" %(test_channel, time_here)
    ws_alice.send(test_channel, 'test_message yay 23423423', time_here)

def scheduler_main(arg):

    now = datetime.today()
    print "Now it's " + str( now )
    starttime = now + timedelta( seconds = delta_to_start )
    delta5sec = timedelta( seconds = delta_between_messages )
    thistime = starttime

    jobs = []
    print "Queueing jobs"
    for i in range( number_of_messages ):
        print "Queueing job at " + str( thistime )
        jobs.append( sched.add_date_job( send_test_message, thistime, [ thistime ] ))
        thistime += delta5sec
    print "Queued jobs"

def start_ws_client_alice():
    wearscript.websocket_client_factory( callback_alice, 'ws://localhost:' + str(WS_PORT) + '/', group = clientGroup, device = aliceDevice )
    # wearscript.websocket_client_factory( callback_alice, 'ws://localhost:' + str(WS_PORT) + '/')

def start_ws_client_bob():
    wearscript.websocket_client_factory( callback_bob, 'ws://localhost:' + str(WS_PORT) + '/', group = clientGroup, device = bobDevice )
    # wearscript.websocket_client_factory( callback_bob, 'ws://localhost:' + str(WS_PORT) + '/')

def start_ws_server():
    glassprov_server_new.main()

if __name__ == '__main__':
    # fire up wear-connect server
    ws_server_greenlet = gevent.spawn(start_ws_server)
    # fire up two clients, Alice and Bob

    ## client Alice: register a channel foo
    ws_client_greenlet_alice = gevent.spawn_later(5, start_ws_client_alice)

    ## client Bob: subscribe to the channel foo
    ## client Bob: listen for the message from Alice
    ws_client_greenlet_bob = gevent.spawn_later(3, start_ws_client_bob)

    # client Alice: send a message on channel foo
    scheduler_loop_greenlet = gevent.spawn_later(6, scheduler_loop, "")

    print "Spawned Greenlets: ws_server_greenlet, ws_client_greenlet_alice, ws_client_greenlet_bob, scheduler_loop_greenlet"
    gevent.joinall([ws_server_greenlet, ws_client_greenlet_alice, ws_client_greenlet_bob])
