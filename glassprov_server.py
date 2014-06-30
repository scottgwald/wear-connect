import gevent.monkey
gevent.monkey.patch_all()
import geventwebsocket.exceptions
import wearscript
import argparse
import time
import sys

ws_dict = {}
ws_dict_chan = {}

def ws_parse(parser):
    print "running ws_parse"
    wearscript.parse(callback, parser)

def ws_send(ws, *argv):
    # global ws_dict
    print "Sending to socket " + ws_dict[ws] + " with args " + str(argv)
    try:
        ws.send(*argv)
    except geventwebsocket.exceptions.WebSocketError:
        print "Sending failed, unregistering ws: " + ws_dict[ws], sys.exc_info()[0]
        unregister(ws)
    except:
        print "Unexpected exception while sending, unregistering: " + ws_dict[ws], sys.exc_info()[0]
        unregister(ws)

def ws_subscribe(ws, chan, callback):
    try:
        ws.subscribe(chan, callback)
    except geventwebsocket.exceptions.WebSocketError:
        print "Subscribe failed, unregistering ws: " + ws_dict[ws], sys.exc_info()[0]
        unregister(ws)
    except KeyError:
        print "KeyError while subscribing. Ignoring."
    except:
        print "Unexpected exception while subscribing. Ignoring." + ws_dict[ws], sys.exc_info()[0]

def ws_unsubscribe(ws, chan):
    try:
        ws.unsubscribe(chan)
    except geventwebsocket.exceptions.WebSocketError:
        print "Unsubscribe failed, unregistering ws: " + ws_dict[ws], sys.exc_info()[0]
        unregister(ws)
    except KeyError:
        print "KeyError while unsubscribing. Ignoring"
    except:
        print "Unexpected exception while unsubscribing. Ignoring." + ws_dict[ws], sys.exc_info()[0]

def unregister(ws):
    global ws_dict
    client_name = ws_dict[ws]
    print "Unregistering client " + client_name
    del ws_dict[ws]
    del ws_dict_chan[client_name]
    for ws in ws_dict.keys():
        # ws_unsubscribe(ws, client_name)
        gevent.spawn(ws_unsubscribe, ws, client_name)

# broadcasts to all but the sender
def broadcast(ws_src, *argv):
    # global ws_dict
    for ws in ws_dict.keys():
        # don't send it back to the source websocket
        if ws is not ws_src:
            gevent.spawn(ws_send, ws, *argv)

def narrowcastRegister(ws_self, client_name):
    print "narrowcastRegister"

    # make everyone else process messages for me
    for ws in ws_dict.keys():
        print "Registering client " + ws_dict[ws] + " to listen on channel " + client_name
        # ws_subscribe(ws, client_name, narrowcast)
        gevent.spawn(ws_subscribe, ws, client_name, narrowcast)
    # prepare me to process messages for everybody else
    for client_chan in ws_dict_chan.keys():
        print "Registering client " + ws_dict[ws_self] + " to listen on channel " + client_chan
        # ws_subscribe(ws_self, client_chan, narrowcast)
        gevent.spawn(ws_subscribe, ws_self, client_chan, narrowcast)

def narrowcast(client_name, *argv):
    print "narrowcasting"
    # might want to catch the keyerror here
    try: 
        ws = ws_dict_chan[client_name]
        gevent.spawn(ws_send, ws, client_name, *argv)
    except exceptions.KeyError:
        print "Didn't find client " + client_name + " in ws_dict_chan"

def callback(ws, **kw):
    global ws_dict
    def register_client(chan, resultChan, client_name):
        if ws not in ws_dict.itervalues():
            print "Registering websocket: |" + client_name +"|"
            ws_dict[ws] = client_name
            ws_dict_chan[client_name] = ws
            narrowcastRegister(ws, client_name)
        else:
            print "Got a registration ping from the same websocket"
        gevent.spawn(ws_send, ws, resultChan, client_name)

    def get_blob(chan, title, body):
        print "Server: Got blob %s %s" % (title,body)
        broadcast(ws, chan, title, body)

    print "processing initial subscription for ws object: " + str(ws)
    gevent.spawn(ws_subscribe, ws, 'register', register_client)
    gevent.spawn(ws_subscribe, ws, 'blob', get_blob)
    # ws_subscribe(ws, 'register', register_client)
    # ws_subscribe(ws, 'blob', get_blob)

    # ws.subscribe('android:glass:f88fca2619bd', narrowcast)
    ws.handler_loop()

if __name__ == '__main__':
    serverThread = gevent.spawn(ws_parse, argparse.ArgumentParser())
    print "And I made it past"
    gevent.joinall([serverThread])

# wearscript.parse(callback, argparse.ArgumentParser())
