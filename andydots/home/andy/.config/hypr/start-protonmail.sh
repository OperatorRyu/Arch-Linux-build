#!/bin/bash
#Start protonmail on startup
(proton-mail &) && slee 2 && xdotool search --name "Proton-Mail" windowminimize
