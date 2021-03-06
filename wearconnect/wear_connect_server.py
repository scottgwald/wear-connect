import gevent.monkey
gevent.monkey.patch_all()
import geventwebsocket.exceptions
import wearscript
import argparse
import time
import sys
import msgpack

retry_period = 1
server_client_prefix = "server"
uber_client_group = "client"
uber_client_device = "uber_client"
uber_client_groupdevice = uber_client_group + ":" + uber_client_device
sleep_before_uber_client_start = 1

class WearConnectServer(object):

    def __init__(self):
        self.ws_dict = {}
        self.ws_dict_chan = {}
        self.uber_client_ws_client = ""
        self.uber_client_ws_server = ""
        self.WS_PORT = 8112
        # TODO: user gevent tools to do client start after server start instead of timing
        self.ws_server_greenlet = gevent.spawn(self.start_ws_server)
        gevent.sleep(sleep_before_uber_client_start)
        self.uber_client_greenlet = gevent.spawn(self.start_uber_client)
        self.sockets_to_channels = {}
        self.channels_to_sockets = {}
        gevent.joinall([self.ws_server_greenlet, self.uber_client_greenlet])

    @property
    def ws_port(self):
        return self.WS_PORT

    def ws_parse(self, parser):
        print "running ws_parse"
        wearscript.parse(self.callback, parser)

    def ws_send(self, ws, *argv):
        # global ws_dict
        registered = True;
        try:
            print "Sending to socket " + self.ws_dict[ws] + " with args " + str(len(str(argv)))
        except KeyError:
            registered = False;
            print "Sending to unregistered socket with args " + str(len(str(argv)))
        try:
            ws.send(*argv)
        except geventwebsocket.exceptions.WebSocketError:
            if registered and ws in self.ws_dict:
                print "Sending failed, unregistering ws: " + self.ws_dict[ws], sys.exc_info()[0]
                self.unregister(ws)
            else:
                print "Sending to unregistered websocket failed with WebSocketError ", sys.exc_info()[0]
        except:
            if registered and ws in self.ws_dict:
                print "Unexpected exception while sending, unregistering: " + self.ws_dict[ws], sys.exc_info()[0]
                self.unregister(ws)
            else:
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

    def uber_client_callback(self, ws, **kw):
        # global uber_client_ws
        self.uber_client_ws_client = ws
        print "I AM THE UBER CLIENT " + ws.group_device
        # set_device_channels happens first, so now just need to look through them
        # an alternative would be to make a "forward" channel 
        def narrowcast_cb(chan, *argv):
            print "Uber client narrowcast callback " + chan

        def subscriptions_cb(chan, groupDevice, channels):
            print "UBER CLIENT SUBSCRIPTIONS CALLBACK " + groupDevice
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

            print "UBER CLIENT SUBSCRIPTIONS CALLBACK " + groupDevice + " adding socket to channels hash"

            for channel in channels:
                # could use "set"
                if channel in self.channels_to_sockets.keys():
                    self.channels_to_sockets[channel].add(groupDeviceSocket)
                else:
                    self.channels_to_sockets[channel] = set([groupDeviceSocket])

            print "UBER CLIENT SUBSCRIPTIONS CALLBACK " + groupDevice + " forwarding subscriptions to " + str(self.ws_dict.values())

            # forward subscriptions to other clients
            for ws_server_socket in self.ws_dict.keys():
                # don't bounce subscriptions back to same client
                if not self.ws_dict[ws_server_socket] == groupDevice and not self.ws_dict[ws_server_socket] == uber_client_groupdevice:
                    # ws_server_socket.send(chan, groupDevice, channels)
                    gevent.spawn(self.ws_send, ws_server_socket, chan, groupDevice, channels)

            try:
                print "uber client knows: " + str(ws.device_to_channels)
            except AttributeError:
                print "uber client doesn't know any subscriptions yet."

        def forward_message(chan, *argv):
            print "forward_message"
            channel_cur = None
            parts = chan.split(':')
            for x in parts:
                if channel_cur is None:
                    channel_cur = x
                else:
                    channel_cur += ':' + x
                if channel_cur in self.channels_to_sockets.keys():
                    print "forwarding " + chan + " on channel " + channel_cur
                    for ws_server_socket in self.channels_to_sockets[channel_cur]:
                        # important: never change the channel mid-flight
                        gevent.spawn(self.ws_send, ws_server_socket, chan, *argv)

        gevent.spawn(self.ws_subscribe, ws, ws.group_device, narrowcast_cb )
        ws.subscribe('subscriptions', subscriptions_cb)
        ws.subscribe('default', forward_message)

        gevent.spawn(self.ws_subscribe, ws, 'subscriptions', subscriptions_cb)
        gevent.spawn(self.ws_send, ws, 'is_uber_client')
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

        def is_uber_client_cb(chan, **kw):
            print "UBER CLIENT SET"
            self.uber_client_ws_server = ws

        # def print_log(channel, body):
        #     print(ws_dict[ws] + ': ' + body)
        gevent.spawn(self.ws_subscribe, ws, 'default', self.forward_cb)
        gevent.spawn(self.ws_subscribe, ws, 'subscriptions', subscriptions_cb );
        gevent.spawn(self.ws_subscribe, ws, 'is_uber_client', is_uber_client_cb );

        # gevent.spawn(ws_subscribe, ws, 'log', print_log)

        try:
            ws.handler_loop()
        except msgpack.exceptions.ExtraData:
            print "ExtraData exception oh nosssssss 2342093. May need to reconnect!!"
        except msgpack.exception.UnpackValueError:
            print "UnpackValue exception blahhhhhh. May need to reconnect!!"

    def start_uber_client(self):
        wearscript.websocket_client_factory( self.uber_client_callback, 'ws://localhost:' + str(self.WS_PORT) + '/', group = uber_client_group, device = uber_client_device )

    def start_ws_server(self):
        wearscript.websocket_server(self.callback, self.WS_PORT)

def main():
    wc_server = WearConnectServer()
    print "WearConnectServer initialized"

if __name__ == '__main__':
    main()
