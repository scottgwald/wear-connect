import gevent.monkey
gevent.monkey.patch_all()
import wearscript
import argparse
import glassprov_server
import time
from apscheduler.scheduler import Scheduler
import logging
from time import sleep
import sys
from datetime import datetime
from datetime import timedelta

WS_PORT = 8112
number_of_messages = 5
delta_to_start = 1
delta_between_messages = 2
client_name_alice = ""
client_name_bob = ""
ws_alice = ""
ws_bob = ""

def start_ws_client_alice():
    wearscript.websocket_client_factory( callback_alice, 'ws://localhost:' + str(WS_PORT) + '/' )


def start_ws_client_bob():
    wearscript.websocket_client_factory( callback_bob, 'ws://localhost:' + str(WS_PORT) + '/' )

def start_ws_server():
    wearscript.websocket_server(glassprov_server.callback, WS_PORT)

def callback_alice(ws, **kw):
    global client_name_alice
    global ws_alice
    ws_alice = ws
    print "Client client_endpoint: " + str(ws.ws.sock.getpeername())

    def registered(chan, name):
        # global client_name_alice # is this necessary?
        print "I'm registered as: " + name
        client_name_alice = name
        print( "Sending register for test_channel" )
        ws.send( 'register_channel', 'test_channel' )

    client_name_alice = "alice_%.6f" % time.time()
    print "Client_alice ws callback, trying to register as " + client_name_alice
    ws.subscribe( 'registered', registered)
    ws.send( 'register', 'registered', client_name_alice)
    ws.handler_loop()

def callback_bob(ws, **kw):
    global client_name_bob
    global ws_bob
    ws_alice = ws
    print "Client client_endpoint: " + str(ws.ws.sock.getpeername())

    def registered(chan, name):
        global client_name_bob
        print "I'm registered as: " + name
        client_name_bob = name
        print( "Sending register for test_channel" )
        ws.send( 'register_channel', 'test_channel' )

    def get_test_channel(chan, arg1, arg2):
        print "Bob got %s on channel %s" % (arg1, chan)

    client_name_bob = "bob_%.6f" % time.time()
    print "Client_bob ws callback, trying to register as " + client_name_bob
    ws.subscribe( 'registered', registered)
    ws.subscribe( 'test_channel', get_test_channel)
    ws.send( 'register', 'registered', client_name_bob)
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
    print "Sending blob to test_channel " + time_here
    ws_alice.send('test_channel', 'test_message yay 23423423', time_here)

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

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    # fire up wear-connect server
    ws_server_greenlet = gevent.spawn(start_ws_server)
    # fire up two clients, Alice and Bob

    ## client Alice: register a channel foo
    ws_client_greenlet_alice = gevent.spawn(start_ws_client_alice)

    ## client Bob: subscribe to the channel foo
    ## client Bob: listen for the message from Alice
    ws_client_greenlet_bob = gevent.spawn(start_ws_client_bob)

    # client Alice: send a message on channel foo
    scheduler_loop_greenlet = gevent.spawn(scheduler_loop, "")

    print "Spawned Greenlets: ws_server_greenlet, ws_client_greenlet_alice, ws_client_greenlet_bob, scheduler_loop_greenlet"
    gevent.joinall([ws_server_greenlet, ws_client_greenlet_alice, ws_client_greenlet_bob])
