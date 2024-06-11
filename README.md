#This contains everything I need for my workstation.

-High Security
-Minimalist
-Dark themes

-Pre Prep-
* Download Arch Linux
https://mirrors.urbanwave.co.za/archlinux/iso/2024.06.01/archlinux-x86_64.iso

* Rufus
https://github.com/pbatard/rufus/releases/download/v4.5/rufus-4.5p.exe

1) Instructions:
    1a) Burn Arch Linux to the USB
    1b) Boot into the BIOS of the laptop
    1c) Select Arch Linux USB as bootable in bootloader (UEFI)
    1d) Select "Install" option and wait for an input prompt

2) -Connect to network-
For ethernet, simply connect it, otherwise for Wifi run the following commands:

iwctl
station wlan0 connect [SSID you want to connect to]
[password of the SSID]
exit

3) Prepping the install script
run the following command and wait for a selection based output:

archinstall

-Select the following-
Archinstall language - Skip
Mirrors > Mirror Region > South Africa
Locales - Skip
Disk Configuration > Use a Best-effort default partition layout > [Model name of drive]/dev/sda/ > xfs > yes
Disk Encryption > Yes > [Set encryption password] 
BootLoader > Grub (Systemd if avaliable)
Swap - Skip
Hostname > andylap
Root Password > [Set root password]
User Account > Add a user > andy > [Set password] > yes > Confirm and Exit
Profile > Type > Desktop > Hyprland > polkit > Graphics driver > [case by case, proprietary] > greeter > sddm
Audio > pipewire
Kernel > ONLY linux-hardened
Additional packages > clamav neovim-qt discord gcc ranger code git nftables spotify-launcher firewalld wireguard-tools kdeconnect htop fastfetch libreoffice-fresh cmake neomutt smbclient nmap fuzzel waybar
Network Configuration > NetworkManager
Timezone > Africa/Johannesburg
Automatic time sync > - Skip
Optional Repositories > multilib
-> Install

Wait for install to finish

4) AUR Packages

-Browser-
Libre Wolf - https://aur.archlinux.org/librewolf.git

-Proton-
Mail - https://aur.archlinux.org/protonmail-desktop.git
VPN - https://aur.archlinux.org/protonvpn.git
Pass - https://aur.archlinux.org/packages/protonpass-bin

-General-
davmail (Required for Neomutt) - https://aur.archlinux.org/davmail.git
anydesk - https://aur.archlinux.org/anydesk-bin.git
youtube-dl - https://aur.archlinux.org/youtube-dl.git
Github - https://aur.archlinux.org/github-desktop.git
Draw.io - https://aur.archlinux.org/drawio-desktop.git

5) Configuration:
    5a) Ranger into /home/andy/.config and paste/replace with these dot files from the repo:
        .config
        .librewolf
    5b) vim into /etc/nftables.conf, Copy paste below:
        
        #!/usr/bin/nft -f
 
        table inet filter
        delete table inet filter
        table inet filter {
        chain input {
        type filter hook input priority filter
        policy drop
 
        ct state invalid drop comment "early drop of invalid connections"
        ct state {established, related} accept comment "allow tracked connections"
        iifname lo accept comment "allow from loopback"
        ip protocol icmp accept comment "allow icmp"
        meta l4proto ipv6-icmp accept comment "allow icmp v6"
        pkttype host limit rate 5/second counter reject with icmpx type admin-prohibited
        counter
        }

        chain forward {
        type filter hook forward priority filter
        policy drop
            }
        }
    
    5c) vim into /etc/sysctl.d/90-network.conf, copy paste below:

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

6) Starting services
    6a) NetworkManager:
        sudo systemctl enable NetworkManager.service
        sudo systemctl start NetworkManager.service

    6b) Firewall:
        sudo systemctl enable nftables
        sudo systemctl start nftables
        nft list ruleset

    6c) Antivirus:
        run the following commands:
        sudo freshclam
        sudo systemctl enable clamav-freshclam.service
        sudo systemctl start clamav-freshclam.service
        sudo systemctl enable clamav-daemon.service
        sudo systemctl start clamav-daemon.service

    6d) Load new properties into system configuration
        sudo sysctl --system
        sudo reboot now

 7) Final Touches
    7a) Librewolf browser:
        Home Page: https://operatorryu.github.io/startpage/
        Search Engine - 4Get.ca
        Extensions:
            - AdNauseam
            - Cookie AutoDelete
            - Dark Reader
            - Disconnect
            - Sidebery
            - uBlock Origin
            - User-Agent Switcher and Manager
    7b) Sddm:
        - vim into /usr/lib/sddm/sddm.conf.d/default.conf
        - under [Theme] edit current to be "Current=andylogin"
