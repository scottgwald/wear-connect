import gevent.monkey
gevent.monkey.patch_all()
import wearscript
import argparse
import wear_connect_server
import time
from apscheduler.scheduler import Scheduler
import logging
from time import sleep
import sys
from datetime import datetime
from datetime import timedelta

# Bob subscribes to a test channel 'test_channel:special'
# A subscription is a request for messages on any channel that begins with the subscribed name.
# Then Alice sends test messages on 'test_channel' and 'test_channel:special:subchannel345345'
# Accordingly, Bob does not receive those on 'test_channel', but does receive the others.

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
test_subchannel = test_channel + ':special'
test_subsubchannel = test_subchannel + ':subchannel345345'

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
    ws.handler_loop()

def callback_bob(ws, **kw):

    def narrowcast_cb(chan, *argv):
        print "Narrowcast callback " + chan

    def get_test_channel(chan, arg1, arg2):
        print "Bob got %s on channel %s" % (arg1, chan)

    print "I'm Bob and my group_device is " + ws.group_device
    ws.subscribe( ws.group_device, narrowcast_cb )
    ws.subscribe( test_subchannel, get_test_channel )
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
    ws_alice.publish(test_channel, 'test_message yay 23423423', time_here)
    ws_alice.publish(test_subsubchannel, 'test_message subsubsub', time_here)

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
    ws_client_greenlet_bob = gevent.spawn_later(3, start_ws_client_bob)
    ws_client_greenlet_alice = gevent.spawn_later(5, start_ws_client_alice)

    # schedule test messages from client Alice
    scheduler_loop_greenlet = gevent.spawn_later(6, scheduler_loop, "")

    print "Spawned Greenlets: ws_server_greenlet, ws_client_greenlet_alice, " \
        +  "ws_client_greenlet_bob, scheduler_loop_greenlet"
    gevent.joinall([ws_server_greenlet, ws_client_greenlet_alice, ws_client_greenlet_bob])
