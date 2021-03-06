#! /bin/bash
# must be run from current directory
# TODO: refer to env path variable so can be run from elsewhere

# install new version of wearscript

curl -L --output wearscript.apk https://github.com/scottgwald/wearscript-android/releases/download/v19.1-upstream-dev/WearScript-debug-low-fps.apk

adb uninstall com.dappervision.wearscript
adb install wearscript.apk

# create config
cp config.json config.json.old &> /dev/null
export WC_LOCAL_IP=`ifconfig | grep -A 3 en0 | grep -oh "inet [0-9]\{1,3\}.[0-9]\{1,3\}.[0-9]\{1,3\}.[0-9]\{1,3\}" | grep -oh "[0-9]\{1,3\}.[0-9]\{1,3\}.[0-9]\{1,3\}.[0-9]\{1,3\}"`
python generate_config.py $WC_LOCAL_IP

# clear off existing scripts
adb shell rm -r /sdcard/wearscript/gists/*

# install this script
adb shell mkdir /sdcard/wearscript/gists/wordconnect
adb push gists/00000000 /sdcard/wearscript/gists/wordconnect

adb push config.json /sdcard/wearscript/gists/wordconnect
adb push js/wc-get-endpoint.js /sdcard/wearscript/gists/wordconnect
