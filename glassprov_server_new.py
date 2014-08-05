import gevent.monkey
gevent.monkey.patch_all()
import geventwebsocket.exceptions
import wearscript
import argparse
import time
import sys

class WearConnectServer(object):

    def __init__(self):
        self.ws_dict = {}
        self.ws_dict_chan = {}
        self.uber_client_ws_client = ""
        self.uber_client_ws_server = ""
        self.WS_PORT = 8112
        self.ws_server_greenlet = gevent.spawn(self.start_ws_server)
        self.uber_client_greenlet = gevent.spawn(self.start_uber_client)
        gevent.joinall([self.ws_server_greenlet, self.uber_client_greenlet])

    @property
    def ws_port(self):
        return self.WS_PORT

    def ws_parse(self, parser):
        print "running ws_parse"
        wearscript.parse(self.callback, parser)

    def ws_send(self, ws, *argv):
        # global ws_dict
        try:
            print "Sending to socket " + self.ws_dict[ws] + " with args " + str(len(str(argv)))
        except KeyError:
            print "Sending to unregistered socket with args " + str(len(str(argv)))
        try:
            ws.send(*argv)
        except geventwebsocket.exceptions.WebSocketError:
            print "Sending failed, unregistering ws: " + self.ws_dict[ws], sys.exc_info()[0]
            self.unregister(ws)
        except:
            print "Unexpected exception while sending, unregistering: " + self.ws_dict[ws], sys.exc_info()[0]
            self.unregister(ws)

    def ws_subscribe(self, ws, chan, callback):
        try:
            print "Subscribing socket " + self.ws_dict[ws] + " to channel " + chan
        except KeyError:
            print "Subscribing unregistered socket to " + chan
        try:
            ws.subscribe(chan, callback)
        except geventwebsocket.exceptions.WebSocketError:
            print "Subscribe failed, unregistering ws: " + self.ws_dict[ws], sys.exc_info()[0]
            self.unregister(ws)
        except KeyError:
            print "KeyError while subscribing. Ignoring."
        except:
            print "Unexpected exception while subscribing. Ignoring." + self.ws_dict[ws], sys.exc_info()[0]

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
        self.uber_client_ws_server.send(channel, groupDevice, *argv)

    def uber_client_callback(self, ws, **kw):
        # global uber_client_ws
        self.uber_client_ws_client = ws
        print "I AM THE UBER CLIENT " + ws.group_device
        # set_device_channels happens first, so now just need to look through them
        # an alternative would be to make a "forward" channel 
        def subscriptions_cb(chan, groupDevice, channels):
            for channel in channels:
                gevent.spawn(self.ws_subscribe, ws, channel, forward_message)
        def forward_message(chan, *argv):
            # need to forward if the channel is contained in external_channels
            if chan in self.uber_client_ws_client.external_channels:
                # todo: replace with hashtable from channels to websockets
                for device in self.uber_client_ws_client.device_to_channels.keys():
                    if chan in self.uber_client_ws_client.device_to_channels[device]:
                        print "Forwarding message on channel %s to client %s" %(chan, device)
                        print "The known devices are " + str(self.ws_dict_chan.keys())
                        try:
                            ws = self.ws_dict_chan[device];
                        except KeyError:
                            print "Unknown client: Couldn't send message on channel %s to client %s" %(chan,device)
                        ws.send(chan, *argv)
        gevent.spawn(self.ws_subscribe, ws, 'subscriptions', subscriptions_cb)
        gevent.spawn(self.ws_send, ws, 'is_uber_client')
        ws.handler_loop() #gevent.spawn this??

    def callback(self, ws, **kw):
        # global ws_dict
        print ws.group_device
        def subscriptions_cb(chan, groupDevice, channels):
            # tell the uber_client about the device's subscriptions
            # THIS MIGHT BE THE CULPRIT
            if ws not in self.ws_dict.itervalues():
                print "Registering websocket: |" + groupDevice + "|"
                self.ws_dict[ws] = groupDevice
                self.ws_dict_chan[groupDevice] = ws
            else:
                print "Got a registration ping from the same websocket"

            if not self.uber_client_ws_server == "":
                self.uber_client_ws_server.send(chan, groupDevice, channels)
            # make sure uber_client will forward to me the channels I have subscribed to
            for channel in channels:
                gevent.spawn(self.ws_subscribe, ws, channel, self.forward_cb)

        def is_uber_client_cb(chan, **kw):
            self.uber_client_ws_server = ws

        # def print_log(channel, body):
        #     print(ws_dict[ws] + ': ' + body)

        gevent.spawn(self.ws_subscribe, ws, 'subscriptions', subscriptions_cb );
        gevent.spawn(self.ws_subscribe, ws, 'is_uber_client', is_uber_client_cb );

        # gevent.spawn(ws_subscribe, ws, 'log', print_log)
        ws.handler_loop()

    def start_uber_client(self):
        wearscript.websocket_client_factory( self.uber_client_callback, 'ws://localhost:' + str(self.WS_PORT) + '/' )

    def start_ws_server(self):
        wearscript.websocket_server(self.callback, self.WS_PORT)

def main():
    wc_server = WearConnectServer()
    print "WearConnectServer initialized"

if __name__ == '__main__':
    main()
