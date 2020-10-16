#!/bin/bash

apt-get update
apt-get install software-properties-common
add-apt-repository universe
apt-get update
apt-get install certbot -y