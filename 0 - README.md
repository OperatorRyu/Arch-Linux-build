#This contains everything I need for my workstation.

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

Select the following:
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
Additional packages > clamav neovim-qt discord gcc ranger code git nftables spotify-launcher vuurmuur wireguard-tools kdeconnect htop fastfetch libreoffice-fresh cmake neomutt smbclient nmap catnip
Network Configuration > NetworkManager
Timezone > Africa/Johannesburg
Automatic time sync > - Skip
Optional Repositories > multilib
-> Install

Wait for install to finish