#!/bin/bash
VIDEO_DIR="/home/andy/.config/hypr/livewallpapers/"

VIDEOS=($(find "$VIDEO_DIR" -type f -name "*.mp4" -or -name "*.mkv" -or -name "*.avi" | shuf))

while true; do
    for VIDEO in "${VIDEOS[@]}"; do

        mpvpaper -o "$VIDEO"
    done
done