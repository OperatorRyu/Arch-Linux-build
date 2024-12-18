# Workstation Setup Guide

This guide contains everything needed to set up my high-security, minimalist workstation.

## Pre-Setup

1. **Download Arch Linux:**
   - [Arch Linux download](https://archlinux.org/download/) (Choose a South African mirror)

## Installation Instructions

1. **Prepare Installation Media:**
   - Burn Arch Linux to a USB drive using Rufus or another tool.

2. **Boot from USB:**
   - Access BIOS/UEFI settings on your laptop.
   - Set the USB drive as the boot device.
   - Choose "Install" and wait for the prompt.

3. **Connect to the Network:**
   - For Ethernet, just connect it.
   - For WiFi, use these commands:
     ```bash
     iwctl
     station wlan0 connect [SSID]
     [password]
     exit
     ```

4. **Run the Installation Script:**
   - Execute:
     ```bash
     archinstall
     ```
   - Follow these selections:
     - **Language:** Skip
     - **Mirror Region:** South Africa
     - **Locales:** Skip
     - **Disk Configuration:** Best-effort default layout on /dev/sda, use XFS, confirm
     - **Disk Encryption:** Yes, set the encryption password
     - **BootLoader:** GRUB (or Systemd if available)
     - **Swap:** Skip
     - **Hostname:** laptop name
     - **Root Password:** Set the root password
     - **User Account:** Add user, set the login password, confirm
     - **Profile:** Desktop, Hyprland, polkit, proprietary graphics driver, no greeter
     - **Audio:** pipewire
     - **Kernel:** linux-hardened
     - **Additional Packages:** ttf-jetbrains-mono-nerd noto-fonts-emoji git qutebrowser clamav neovim discord gcc openssh nftables spotify-launcher firewalld wireguard-tools kdeconnect htop fastfetch libreoffice-fresh cmake smbclient nmap waybar dunst hyprlock hypridle gnome-keyring ly cava python-pywal
     - **Network Configuration:** NetworkManager
     - **Timezone:** Africa/Johannesburg
     - **Automatic Time Sync:** Skip
     - **Optional Repositories:** multilib
     - Select **Install**, wait for completion, then reboot and log in.

5. **Clone Repo and move dotfiles**

   - Clone repo
   ```bash
     git clone https://github.com/OperatorRyu/Arch-Linux-build.git /home/[Your Username]/aur
   ```
   - Move dotfiles
   ```bash
     cd /home/[Your Username]/aur/Arch-Linux-build/andydots/home/andy/
     cp -rvi /home/[Your Username]/aur/Arch-Linux-build/andydots/home/andy/.config /home/[Your Username]/
   ```
6. **Install AUR Software (Check their dependencies)**
   tofi 
   anydesk-bin 
   youtube-dl 
   github-desktop 
   drawio-desktop 
   wlogout 
   cava 
   pw-volume 
   proton-mail-bin 
   protonvpn 
   protonpass-bin 
   standardnotes-desktop

7. **Hardening Security**

   - Networking (Set a Static IP)
   ```bash
      sudo nmcli con modify "$ETH_INTERFACE" ipv4.addresses "192.168.8.11/24"
      sudo nmcli con modify "$ETH_INTERFACE" ipv4.gateway "192.168.8.2"
      sudo nmcli con modify "$ETH_INTERFACE" ipv4.dns "94.140.14.14,94.140.15.15"
      sudo nmcli con modify "$ETH_INTERFACE" ipv4.method manual
      sudo nmcli con up "$ETH_INTERFACE"
      sudo nmcli con modify "$WIFI_INTERFACE" ipv4.addresses "192.168.8.11/24"
      sudo nmcli con modify "$WIFI_INTERFACE" ipv4.gateway "192.168.8.2"
      sudo nmcli con modify "$WIFI_INTERFACE" ipv4.dns "94.140.14.14,94.140.15.15"
      sudo nmcli con modify "$WIFI_INTERFACE" ipv4.method manual
      sudo nmcli con up "$WIFI_INTERFACE"
   ```
   - Firewall
   ```bash
   vim /etc/nftables.conf
   ```

   ```bash
   #!/usr/bin/nft -f
      table inet filter {
      chain input {
      type filter hook input priority filter; policy drop;
      ct state invalid drop
      ct state {established, related} accept
      iifname lo accept
      ip protocol icmp accept
      meta l4proto ipv6-icmp accept
      pkttype host limit rate 5/second counter reject with icmpx type admin-prohibited
      }

      chain forward {
      type filter hook forward priority filter; policy drop;
      }
   }
   ```
   :w and :exit

   ```bash
   vim /etc/sysctl.d/90-network.conf
   ```
   ```bash
   net.ipv4.ip_forward = 0
   net.ipv6.conf.all.forwarding = 0
   net.ipv4.tcp_syncookies = 1
   net.ipv4.conf.all.accept_redirects = 0
   net.ipv4.conf.default.accept_redirects = 0
   net.ipv4.conf.all.secure_redirects = 0
   net.ipv4.conf.default.secure_redirects = 0
   net.ipv6.conf.all.accept_redirects = 0
   net.ipv6.conf.default.accept_redirects = 0
   net.ipv4.conf.all.send_redirects = 0
   net.ipv4.conf.default.send_redirects = 0
   ```
   :w and :exit

   8. **Start Services**
   ```bash
   #NetworkManager
   sudo systemctl enable NetworkManager.service
   sudo systemctl start NetworkManager.service

   #firewall
   sudo systemctl enable nftables
   sudo systemctl start nftables
   nft list ruleset

   #antivirus
   sudo freshclam
   sudo systemctl enable clamav-freshclam.service
   sudo systemctl start clamav-freshclam.service
   sudo systemctl enable clamav-daemon.service
   sudo systemctl start clamav-daemon.service
   ```