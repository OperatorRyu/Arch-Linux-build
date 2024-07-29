# Workstation Setup Guide

This guide contains everything needed to set up a high-security, minimalist workstation.

## Pre-Setup

1. **Download Arch Linux:**
   - [Arch Linux download](https://archlinux.org/download/) (Choose a South African mirror)

2. **Download Rufus (for Windows users):**
   - [Rufus v4.5](https://github.com/pbatard/rufus/releases/download/v4.5/rufus-4.5p.exe)
   - Or use a similar tool compatible with your OS

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
     - **Disk Configuration:** Best-effort default layout on `/dev/sda`, use XFS, confirm
     - **Disk Encryption:** Yes, set a password
     - **BootLoader:** GRUB (or Systemd if available)
     - **Swap:** Skip
     - **Hostname:** andylap
     - **Root Password:** Set a password
     - **User Account:** Add user, set a password, confirm
     - **Profile:** Desktop, Hyprland, polkit, proprietary graphics driver, no greeter
     - **Audio:** pipewire
     - **Kernel:** `linux-hardened`
     - **Additional Packages:** Select all listed packages
     - **Network Configuration:** NetworkManager
     - **Timezone:** Africa/Johannesburg
     - **Automatic Time Sync:** Skip
     - **Optional Repositories:** multilib
   - Select **Install**, wait for completion, then reboot and log in.

## Install AUR Packages

1. **Proton:**
   - [Protonmail](https://aur.archlinux.org/proton-mail-bin.git)
   - [ProtonVPN](https://aur.archlinux.org/protonvpn.git)
   - [ProtonPass](https://aur.archlinux.org/packages/protonpass-bin)
   - [Proton Standard Notes](https://aur.archlinux.org/packages/standardnotes-desktop)

2. **General:**
   - [Anydesk](https://aur.archlinux.org/anydesk-bin.git)
   - [youtube-dl](https://aur.archlinux.org/youtube-dl.git)
   - [GitHub Desktop](https://aur.archlinux.org/github-desktop.git)
   - [Draw.io](https://aur.archlinux.org/drawio-desktop.git)
   - [wlogout](https://aur.archlinux.org/wlogout.git)
   - [cava](https://aur.archlinux.org/cava.git)

## Configuration

1. **Update Ranger Config:**
   - Copy dot files to `/home/andy/.config`

2. **Configure Firewall:**
   - Edit `/etc/nftables.conf`:
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
   - Edit `/etc/sysctl.d/90-network.conf`:
     ```bash
     # Do not act as a router
     net.ipv4.ip_forward = 0
     net.ipv6.conf.all.forwarding = 0

     # SYN flood protection
     net.ipv4.tcp_syncookies = 1

     # Disable ICMP redirect
     net.ipv4.conf.all.accept_redirects = 0
     net.ipv4.conf.default.accept_redirects = 0
     net.ipv4.conf.all.secure_redirects = 0
     net.ipv4.conf.default.secure_redirects = 0
     net.ipv6.conf.all.accept_redirects = 0
     net.ipv6.conf.default.accept_redirects = 0

     # Do not send ICMP redirects
     net.ipv4.conf.all.send_redirects = 0
     net.ipv4.conf.default.send_redirects = 0
     ```

## Start Services

1. **NetworkManager:**
   ```bash
   sudo systemctl enable NetworkManager.service
   sudo systemctl start NetworkManager.service

2. **Firewall:**
```bash
sudo systemctl enable nftables
sudo systemctl start nftables
nft list ruleset
```

3. **Antivirus:**
```bash
sudo freshclam
sudo systemctl enable clamav-freshclam.service
sudo systemctl start clamav-freshclam.service
sudo systemctl enable clamav-daemon.service
sudo systemctl start clamav-daemon.service
```

4. **Apply System Configuration:**
```bash
sudo sysctl --system
sudo reboot now
```

## Final Touches
**Browser:**
1) Set Home Page to https://operatorryu.github.io/startpage/
2) Set Search engine to https://4Get.ca

**Dot files:**
Copy to /home/[username]/.config