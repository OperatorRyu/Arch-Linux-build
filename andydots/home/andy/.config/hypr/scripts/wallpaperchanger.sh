#!/bin/bash

random_number=$((RANDOM % 53 + 1))
directory1="/home/ryu/.config/hypr/wallpapers"
directory2="/home/ryu/.config/hypr/"
file_name="${random_number}.png"

if [ -f "$directory1/$file_name" ]; then
    if [ -f "$directory2/wallpaper.png" ]; then
        rm "$directory2/wallpaper.png"
    fi
    
    cp "$directory1/$file_name" "$directory2/wallpaper.png"
    echo "File '$file_name' copied and renamed to 'wallpaper.png'."
else
    echo "File '$file_name' does not exist in '$directory1'."
fi

wal -i "$directory2/wallpaper.png"
hyprctl hyprpaper wallpaper "DP-1, $directory2/wallpaper.png"