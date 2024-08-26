#!/bin/bash
#static IP
#ask questions
echo "Note! this script is intended to set your IP to static, DO NOT USE UNLESS YOU KNOW WHAT YOURE DOING!"
read -rp "What should the IP address be of this laptop? (192.168.8.11 is a good start): " STATIC_IP
read -rp "What is the router IP address? : " GATEWAY_IP
read -rp "Do you want to use AdGuard DNS? (yes/no): " USE_ADGUARD_DNS

if [[ "$USE_ADGUARD_DNS" == "yes" ]]; then
    DNS_SERVERS="94.140.14.14,94.140.15.15"
else
    DNS_SERVERS="8.8.8.8,8.8.4.4"
fi

ETH_INTERFACE="eth0"
WIFI_INTERFACE="wlan0"

#Ethernet
sudo nmcli con modify "$ETH_INTERFACE" ipv4.addresses "$STATIC_IP/24"
sudo nmcli con modify "$ETH_INTERFACE" ipv4.gateway "$GATEWAY_IP"
sudo nmcli con modify "$ETH_INTERFACE" ipv4.dns "$DNS_SERVERS"
sudo nmcli con modify "$ETH_INTERFACE" ipv4.method manual
sudo nmcli con up "$ETH_INTERFACE"

#Wireless
sudo nmcli con modify "$WIFI_INTERFACE" ipv4.addresses "$STATIC_IP/24"
sudo nmcli con modify "$WIFI_INTERFACE" ipv4.gateway "$GATEWAY_IP"
sudo nmcli con modify "$WIFI_INTERFACE" ipv4.dns "$DNS_SERVERS"
sudo nmcli con modify "$WIFI_INTERFACE" ipv4.method manual
sudo nmcli con up "$WIFI_INTERFACE"