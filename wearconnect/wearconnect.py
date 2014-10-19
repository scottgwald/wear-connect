import gevent.monkey
gevent.monkey.patch_all()
import geventwebsocket.exceptions
from gevent.pool import Pool
import wearscript
from wearscript.socket import WebSocketServerConnection
import argparse
import time
import sys
import msgpack
from gevent.event import Event
from geventwebsocket.handler import WebSocketHandler
from gevent import pywsgi
from gevent.queue import Queue, Empty

retry_period = 1
server_client_prefix = "server"
uber_client_group = "client"
uber_client_device = "uber_client"
uber_client_groupdevice = uber_client_group + ":" + uber_client_device
# TODO: GET RID OF THIS
sleep_before_uber_client_start = 1
DEBUG_INTERNAL = False
DEBUG_EXTERNAL = False

class WearConnectServer(object):

    def __init__(self):

        #
        # Dictionary: key is a websocket, value is a name
        #
        self.ws_dict = {}

        #
        # Dictionary: key is a name, value is a websocket
        #
        self.ws_dict_chan = {}

        #
        # Dictionary: key is a channel name, value is a list of websockets
        #
        self.channels_to_sockets = {}
        self.uber_client_ws_client = ""
        self.uber_client_ws_server = ""
        self.WS_PRIVATE_PORT = 8111
        self.WS_PORT = 8112
        self.uber_client_ready = Event()
        self.private_server_ready = Event()
        self.uber_server_socket_ready = Event()
        self.public_ready = Event()
        self.uber_client_subscriptions_queue = Queue()
        self.DEBUG_INTERNAL = DEBUG_INTERNAL
        self.DEBUG_EXTERNAL = DEBUG_EXTERNAL
        print("Initialized WearConnectServer")
        # TODO: user gevent tools to do client start after server start instead of timing

    def run(self):
        print("Running WearConnectServer")
        self.ws_private_server_greenlet = gevent.spawn(self.start_ws_private_server)
        self.uber_client_greenlet = gevent.spawn(self.start_uber_client)
        self.ws_server_greenlet = gevent.spawn(self.start_ws_server)
        gevent.joinall([self.ws_server_greenlet, self.uber_client_greenlet])

    @property
    def ws_port(self):
        return self.WS_PORT

    def ws_parse(self, parser):
        print "running ws_parse"
        wearscript.parse(self.callback, parser)

    def ws_send(self, ws, *argv, **kw):
        internal = kw.get('internal', False)
        if internal and self.DEBUG_INTERNAL:
            debug = True
        elif not internal and self.DEBUG_EXTERNAL:
            debug = True
        else:
            debug = False
        # global ws_dict
        registered = True;
        if debug:
            try:
                print "Sending to socket " + self.ws_dict[ws] + " with args " + str(len(str(argv)))
            except KeyError:
                registered = False;
                print "Sending to unregistered socket with args " + str(len(str(argv)))
        try:
            ws.send(*argv)
        except geventwebsocket.exceptions.WebSocketError:
            if registered and ws in self.ws_dict:
                if debug:
                    print "Sending failed, unregistering ws: " + self.ws_dict[ws], sys.exc_info()[0]
                self.unregister(ws)
            else:
                if debug:
                    print "Sending to unregistered websocket failed with WebSocketError ", sys.exc_info()[0]
        except:
            if registered and ws in self.ws_dict:
                if debug:
                    print "Unexpected exception while sending, unregistering: " + self.ws_dict[ws], sys.exc_info()[0]
                self.unregister(ws)
            else:
                if debug:
                    print "Sending to unregistered websocket failed. ", sys.exc_info()[0]

    #
    # A CLIENT WS ENDPOINT IS ANNOUNCING A SUBSCRIPTION
    #
    # special case for registration
    #
    def ws_subscribe(self, ws, chan, callback):
        try:
            ws.subscribe(chan, callback)
            subscribed = True
        except geventwebsocket.exceptions.WebSocketError:
            registered = self.safe_print_ws_exception(ws, "Subscribe failed.")
            if registered:
                # TODO: do this with gevent??
                self.unregister(ws)
        except KeyError:
            print "KeyError while subscribing. Ignoring."
        except:
            print "Unexpected exception while subscribing. Ignoring." + self.ws_dict[ws], sys.exc_info()[0]

    def ws_queue_subscribe(self, queue, ws, chan, callback):
        try:
            ws.subscribe(chan, callback)
            queue.put("Bam")
            subscribed = True
        except geventwebsocket.exceptions.WebSocketError:
            registered = self.safe_print_ws_exception(ws, "Subscribe failed.")
            if registered:
                # TODO: do this with gevent??
                self.unregister(ws)
        except KeyError:
            print "KeyError while subscribing. Ignoring."
        except:
            print "Unexpected exception while subscribing. Ignoring." + self.ws_dict[ws], sys.exc_info()[0]

    #
    # A SERVER-SIDE WS ENDPONT IS
    #

    def ws_self_subscribe(self, ws, chan, callback):
        subscribed = False
        while not subscribed:
            if ws in self.ws_dict:
                try:
                    ws.subscribe(chan, callback)
                    subscribed = True
                except geventwebsocket.exceptions.WebSocketError:
                    print "Subscribe failed, unregistering ws: " + self.ws_dict[ws], sys.exc_info()[0]
                    self.unregister(ws)
                except KeyError:
                    print "KeyError while subscribing. Ignoring."
                except:
                    print "Unexpected exception while subscribing. Ignoring." + self.ws_dict[ws], sys.exc_info()[0]
            else:
                print "ws_subscribe: The known devices are " + str(self.ws_dict_chan.keys())
                print "Retrying subscribe on channel " + chan
                gevent.sleep(retry_period)

    def ws_unsubscribe(self, ws, chan):
        try:
            ws.unsubscribe(chan)
        except geventwebsocket.exceptions.WebSocketError:
            print "Unsubscribe failed, unregistering ws: " + self.ws_dict[ws], sys.exc_info()[0]
            self.unregister(ws)
        except KeyError:
            print "KeyError while unsubscribing. Ignoring"
        except:
            print "Unexpected exception while unsubscribing. Ignoring." + self.ws_dict[ws], sys.exc_info()[0]

    def safe_print_ws_exception(self, ws, exception_text):
        try:
            print exception_text + self.ws_dict[ws], sys.exc_info()[0]
            registered = True
        except KeyError:
            registered = False
            print "Unknown websocket. " + exception_text, sys.exc_info()[0]
        return registered

    def unregister(self, ws):
        global ws_dict
        client_name = self.ws_dict[ws]
        print "Unregistering client " + client_name
        del self.ws_dict[ws]
        del self.ws_dict_chan[client_name]
        for ws in self.ws_dict.keys():
            # self.ws_unsubscribe(ws, client_name)
            gevent.spawn(self.ws_unsubscribe, ws, client_name)

    # broadcasts to all but the sender
    def broadcast(self, ws_src, *argv):
        # global ws_dict
        for ws in self.ws_dict.keys():
            # don't send it back to the source websocket
            if ws is not ws_src:
                gevent.spawn(self.ws_send, ws, *argv)

    def narrowcast(self, client_name, *argv):
        print "narrowcasting"
        # might want to catch the keyerror here
        try: 
            ws = self.ws_dict_chan[client_name]
            gevent.spawn(self.ws_send, ws, client_name, *argv)
        except exceptions.KeyError:
            print "Didn't find client " + client_name + " in ws_dict_chan"

    def forward_cb(self, channel, groupDevice, *argv):
        gevent.spawn(self.ws_send, self.uber_client_ws_server, channel, groupDevice, *argv)

    def uber_server_callback(self, ws, **kw):
        ws.registered = False
        init_greenlets = []
        if self.DEBUG_INTERNAL:
            print "registered is " + str(ws.registered)
            print "server-side ws callback: " + ws.group_device
        def subscriptions_cb(chan, groupDevice, channels):
            if not ws.registered:
                if groupDevice not in self.ws_dict_chan.keys():
                    # might want to synchronize this ...
                    self.ws_dict_chan[groupDevice] = ws
                    self.ws_dict[ws] = groupDevice
                    ws.registered = True
                    if self.DEBUG_INTERNAL:
                        print "registered is now " + str(ws.registered)
                    # send out all existing subscriptions
                    try:
                        for device in self.uber_client_ws_client.device_to_channels.keys():
                            gevent.spawn(self.ws_send, ws, 'subscriptions', device, self.uber_client_ws_client.device_to_channels[device])
                    except AttributeError:
                        print "Trouble forwarding subscriptions to new client", sys.exc_info()[0]

            if not self.uber_client_ws_server == "":
                gevent.spawn(self.ws_send, self.uber_client_ws_server, chan, groupDevice, channels)

        def is_uber_client_cb(chan, **kw):
            if self.DEBUG_INTERNAL:
                print "UBER CLIENT SET"
            self.uber_client_ws_server = ws
            # self.uber_client_ready.set()

        # def print_log(channel, body):
        #     print(ws_dict[ws] + ': ' + body)
        init_greenlets.append( gevent.spawn(self.ws_queue_subscribe, self.uber_client_subscriptions_queue, ws, 'default', self.forward_cb) )
        init_greenlets.append( gevent.spawn(self.ws_queue_subscribe, self.uber_client_subscriptions_queue, ws, 'subscriptions', subscriptions_cb ) )
        init_greenlets.append( gevent.spawn(self.ws_queue_subscribe, self.uber_client_subscriptions_queue, ws, 'is_uber_client', is_uber_client_cb ) )
        gevent.joinall(init_greenlets)
        # gevent.spawn(ws_subscribe, ws, 'log', print_log)
        self.uber_server_socket_ready.set()
        try:
            ws.handler_loop()
        except msgpack.exceptions.ExtraData:
            print "ExtraData exception oh nosssssss 2342093. May need to reconnect!!"
        except msgpack.exception.UnpackValueError:
            print "UnpackValue exception blahhhhhh. May need to reconnect!!"

    def uber_client_callback(self, ws, **kw):
        self.uber_server_socket_ready.wait()
        init_greenlets = []
        # global uber_client_ws
        self.uber_client_ws_client = ws
        if self.DEBUG_INTERNAL:
            print "I AM THE UBER CLIENT " + ws.group_device
        # set_device_channels happens first, so now just need to look through them
        # an alternative would be to make a "forward" channel 
        def narrowcast_cb(chan, *argv):
            print "Uber client narrowcast callback " + chan

        def subscriptions_cb(chan, groupDevice, channels):
            if self.DEBUG_INTERNAL:
                print "UBER CLIENT SUBSCRIPTIONS CALLBACK " + groupDevice
            try:
                if self.DEBUG_INTERNAL:
                    print("Number of items left on subscriptions queue: " + str(self.uber_client_subscriptions_queue.qsize()))
                self.uber_client_subscriptions_queue.get_nowait()
            except Empty:
                self.uber_client_ready.set()
            # maintain mapping of channels to sockets
            # and sockets to channels
            if groupDevice.startswith(server_client_prefix):
                return
            if groupDevice not in self.ws_dict_chan.keys():
                print "Can't process subscriptions for " + groupDevice + ", not in ws_dict_chan.keys(): " + str(ws_dict_chan.keys())
                return
            else:
                print "Found " + groupDevice + " in ws_dict_chan.keys()"

            groupDeviceSocket = self.ws_dict_chan[groupDevice]
            # ignore channels that begin with "server:"
            if self.DEBUG_INTERNAL:
                print "UBER CLIENT SUBSCRIPTIONS CALLBACK " + groupDevice + " adding socket to channels hash"

            for channel in channels:
                # could use "set"
                if channel in self.channels_to_sockets.keys():
                    self.channels_to_sockets[channel].add(groupDeviceSocket)
                else:
                    self.channels_to_sockets[channel] = set([groupDeviceSocket])

            if self.DEBUG_INTERNAL:
                print "UBER CLIENT SUBSCRIPTIONS CALLBACK " + groupDevice + " forwarding subscriptions to " + str(self.ws_dict.values())

            # forward subscriptions to other clients
            for ws_server_socket in self.ws_dict.keys():
                # don't bounce subscriptions back to same client
                if not self.ws_dict[ws_server_socket] == groupDevice and not self.ws_dict[ws_server_socket] == uber_client_groupdevice:
                    # ws_server_socket.send(chan, groupDevice, channels)
                    gevent.spawn(self.ws_send, ws_server_socket, chan, groupDevice, channels, internal = True )

            if self.DEBUG_INTERNAL:
                try:
                    print "uber client knows: " + str(ws.device_to_channels)
                except AttributeError:
                    print "uber client doesn't know any subscriptions yet."

        def forward_message(chan, *argv):
            if self.DEBUG_INTERNAL:
                print "forward_message"
            channel_cur = None
            parts = chan.split(':')
            for x in parts:
                if channel_cur is None:
                    channel_cur = x
                else:
                    channel_cur += ':' + x
                if channel_cur in self.channels_to_sockets.keys():
                    if self.DEBUG_INTERNAL:
                        print "forwarding " + chan + " on channel " + channel_cur
                    for ws_server_socket in self.channels_to_sockets[channel_cur]:
                        # important: never change the channel mid-flight
                        gevent.spawn(self.ws_send, ws_server_socket, chan, *argv)

        init_greenlets.append( gevent.spawn(self.ws_subscribe, ws, ws.group_device, narrowcast_cb ) )
        init_greenlets.append( gevent.spawn(self.ws_subscribe, ws, 'subscriptions', subscriptions_cb ) )
        init_greenlets.append( gevent.spawn(self.ws_subscribe, ws, 'default', forward_message ) )
        init_greenlets.append( gevent.spawn(self.ws_send, ws, 'is_uber_client') )
        gevent.joinall(init_greenlets)
        # self.uber_client_ready.set()
        ws.handler_loop() #gevent.spawn this??

    def callback(self, ws, **kw):
        ws.registered = False
        print "registered is " + str(ws.registered)
        # global ws_dict
        print "server-side ws callback: " + ws.group_device
        def subscriptions_cb(chan, groupDevice, channels):
            if not ws.registered:
                if groupDevice not in self.ws_dict_chan.keys():
                    # might want to synchronize this ...
                    self.ws_dict_chan[groupDevice] = ws
                    self.ws_dict[ws] = groupDevice
                    ws.registered = True
                    print "registered is now " + str(ws.registered)
                    # send out all existing subscriptions
                    try:
                        for device in self.uber_client_ws_client.device_to_channels.keys():
                            gevent.spawn(self.ws_send, ws, 'subscriptions', device, self.uber_client_ws_client.device_to_channels[device])
                    except AttributeError:
                        print "Trouble forwarding subscriptions to new client", sys.exc_info()[0]

            if not self.uber_client_ws_server == "":
                gevent.spawn(self.ws_send, self.uber_client_ws_server, chan, groupDevice, channels)

        # def print_log(channel, body):
        #     print(ws_dict[ws] + ': ' + body)
        gevent.spawn(self.ws_subscribe, ws, 'default', self.forward_cb)
        gevent.spawn(self.ws_subscribe, ws, 'subscriptions', subscriptions_cb );

        # gevent.spawn(ws_subscribe, ws, 'log', print_log)

        try:
            ws.handler_loop()
        except msgpack.exceptions.ExtraData:
            print "ExtraData exception oh nosssssss 2342093. May need to reconnect!!"
        except msgpack.exception.UnpackValueError:
            print "UnpackValue exception blahhhhhh. May need to reconnect!!"

    def init_complete(self):
        self.public_ready.wait()
        print("Initialization of WearConnectServer complete.")

    def start_uber_client(self):
        self.private_server_ready.wait()
        wearscript.websocket_client_factory( self.uber_client_callback, 'ws://localhost:' + str(self.WS_PRIVATE_PORT) + '/',
            group = uber_client_group, device = uber_client_device, debug = DEBUG_INTERNAL )

    def start_ws_private_server(self):
        self.websocket_server_with_ready_event(self.uber_server_callback, self.WS_PRIVATE_PORT,
            self.private_server_ready, debug = self.DEBUG_INTERNAL, private = True)

    def start_ws_server(self):
        self.uber_client_ready.wait()
        self.websocket_server_with_ready_event(self.callback, self.WS_PORT, self.public_ready, debug = DEBUG_EXTERNAL )
        print("WearConnectServer serving on port " + str(self.WS_PORT))

    def websocket_server_with_ready_event(self, callback, websocket_port, ready_event, **kw):
        private = kw.get('private', False)
        pool = Pool(1)
        kw.setdefault('group', 'serverrrr')
        def websocket_app(environ, start_response):
            if environ["PATH_INFO"] == '/':
                ws = environ["wsgi.websocket"]
                callback(WebSocketServerConnection(ws, **kw))
        if private:
            wsgi_server = pywsgi.WSGIServer(("", websocket_port), websocket_app,
                                            handler_class=WebSocketHandler, spawn=pool)
        else:
            wsgi_server = pywsgi.WSGIServer(("", websocket_port), websocket_app,
                                handler_class=WebSocketHandler)

        wsgi_server.start()
        ready_event.set()

def main():
    wc_server = WearConnectServer()
    wc_server.run()

if __name__ == '__main__':
    main()

