#!/bin/bash

#1) install base software
sudo pacman -Syu clamav neovim discord gcc yazi git openssh nftables spotify-launcher firewalld wireguard-tools kdeconnect htop fastfetch libreoffice-fresh cmake smbclient nmap waybar dunst hyprlock hypridle gnome-keyring ly cava pywal

#2) install git software
git clone https://github.com/NvChad/starter ~/.config/nvim && nvim

#3) install paru and aur packages
mkdir -p /home/$USER/aur/
sudo pacman -S --needed base-devel
git clone https://aur.archlinux.org/paru.git /home/$USER/aur/paru
cd /home/$USER/aur/paru
makepkg -si
paru -S --needed tofi anydesk-bin youtube-dl github-desktop drawio-desktop wlogout cava pw-volume superproductivity librewolf proton-mail-bin protonvpn protonpass-bin standardnotes-desktop

#4) move configs
#4.1) backup existing .config
sudo cp /home/$USER/.config/ /home/$USER/.config.bak
#4.2) replace configs
mv -vn andydots/home/andy/.config/* /home/$USER/.config/

#5) configure firewall:
#5.1) backup existing settings
sudo cp /etc/nftables.conf /etc/nftables.conf.bak
#replace firewall config
sudo bash -c 'cat > /etc/nftables.conf' << EOF
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
EOF

# Backup existing /etc/sysctl.d/90-network.conf
sudo cp /etc/sysctl.d/90-network.conf /etc/sysctl.d/90-network.conf.bak

# Edit /etc/sysctl.d/90-network.conf
sudo bash -c 'cat > /etc/sysctl.d/90-network.conf' << EOF
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
EOF

#set static IP


#start services

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

#return permissions back to user
sudo chown -R $USER:$USER /home/$USER/aur/
chmod -R 777 /home/$USER/aur/
sudo chown -R $USER:$USER /home/$USER/.config/
chmod -R 777 /home/$USER/.config/

#end script
sudo sysctl --system
echo "System Ready, Reboot? [y/n]"
read -r response
if [[ "$response" == "y" || "$response" == "Y" ]]; then
    sudo reboot now
else
    echo "Reboot aborted. Please Reboot when you are ready."
fi