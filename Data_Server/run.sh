#!/usr/bin/env bash

node src/main.js \
    --host mqtt://104.199.215.165 \
    --addr "00000000aa4f304a" \
    --username hsnl_lab \
    --password 66066076 \
    --firebase adminsdk.json \
    --topics "GIOT-GW/UL/1C497B43217A"
