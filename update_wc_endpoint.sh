#! /bin/bash

export WC_LOCAL_IP=`ifconfig | grep -A 3 en0 | grep -oh "inet [0-9]\{1,3\}.[0-9]\{1,3\}.[0-9]\{1,3\}.[0-9]\{1,3\}" | grep -oh "[0-9]\{1,3\}.[0-9]\{1,3\}.[0-9]\{1,3\}.[0-9]\{1,3\}"`
echo "Setting wc_endpoint ip address to "$WC_LOCAL_IP
python generate_config.py $WC_LOCAL_IP
