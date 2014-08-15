# WearConnect tests

Run from parent directory of wear-connect as such:

    export WEAR_CONNECT_PATH = "path/to/wear-connect-archive"
    cd $WEAR_CONNECT_PATH/..
    python -m wear-connect.test.test-timeout

### test-timeout

Attempt to send a bunch of ~100Kb messages from Alice to
Bob. Adjusting `delta_between_messages` shows what happens
when Greenlets attempt to access busy websockets. First
there is a gevent exception indicatin the websocket is in
use, then messages get corrupted, breaking the websocket.

Results: sending at 10Hz is fine, but 20Hz is not.

Next:

1. queue messages and zip through the queue
2. throw away messages when the queue is long

### test-queue

Put test messages in a queue and link finish of sending each with the start
of sending the next.

### test-image-source

Send images to test client periodically. Messages are queued if not
cleared out fast enough.

Discovered that with multiple clients, when one socket blocks, messages
to all sockets are blocked

### many-clients

Same as image-source but open many clients
