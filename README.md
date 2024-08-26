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
     - **Hostname:** [Give a name to the device]
     - **Root Password:** Set the root password
     - **User Account:** Add user, set the login password, confirm
     - **Profile:** Desktop, Hyprland, polkit, proprietary graphics driver, no greeter
     - **Audio:** pipewire
     - **Kernel:** linux-hardened
     - **Additional Packages:** git
     - **Network Configuration:** NetworkManager
     - **Timezone:** Africa/Johannesburg
     - **Automatic Time Sync:** Skip
     - **Optional Repositories:** multilib
     - Select **Install**, wait for completion, then reboot and log in.

## Clone Repo

   ```bash
git clone https://github.com/OperatorRyu/Arch-Linux-build.git /home/[user]/
   ```

## Install Software

```bash
cd /home/[user]/
sudo bash finalize.sh
```

## Final Touches

**These are primarily for me and the general user wont make use of it at all**

**Browser:**
1) Set Home Page to https://operatorryu.github.io/startpage/
2) Set Search engine to https://4Get.ca

**Static IP Address**

```bash
cd /home/[user]/
sudo bash static_ip.sh
```
