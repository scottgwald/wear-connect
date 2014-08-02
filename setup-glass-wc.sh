#! /bin/bash

# install new version of wearscript

curl -L --output wearscript.apk https://github.com/scottgwald/wearscript-android/releases/download/v19.1-upstream-dev/WearScript-debug-low-fps.apk

adb uninstall com.dappervision.wearscript
adb install wearscript.apk

# clear off existing scripts
adb shell rm -r /sdcard/wearscript/gists/*

# install this script
adb shell mkdir /sdcard/wearscript/gists/wordconnect
adb push gists/00000000 /sdcard/wearscript/gists/wordconnect

# set endpoint
# setendpoint.sh
