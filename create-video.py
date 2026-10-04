#!/usr/bin/env python3
"""
create-video.py
Generates a simple cinematic video (barbad.mp4) using FFmpeg.
Creates a slow fade-in/out with a dark burgundy gradient and text.
"""

import subprocess
import sys
import os

OUTPUT = "barbad.mp4"
DURATION = 30  # seconds
FPS = 30
WIDTH = 1280
HEIGHT = 720

def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: FFmpeg is not installed or not in PATH.")
        print("Please install FFmpeg: https://ffmpeg.org/download.html")
        sys.exit(1)

def generate_video():
    # Create a color gradient background with drawtext
    # Using a simple approach: color source with fade in/out and text overlay
    filter_complex = (
        f"color=c=#1a0a0f:s={WIDTH}x{HEIGHT}:d={DURATION},"
        f"format=yuv420p,"
        f"fade=t=in:st=0:d=2,"
        f"fade=t=out:st={DURATION-2}:d=2,"
        f"drawtext=text='still, the light':"
        f"fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf:"
        f"fontcolor=#f4e9e2:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-40:"
        f"alpha='if(lt(t,2),0,if(lt(t,4),(t-2)/2,1))',"
        f"drawtext=text='a quiet truth':"
        f"fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf:"
        f"fontcolor=#d9b1b1:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+60:"
        f"alpha='if(lt(t,3),0,if(lt(t,5),(t-3)/2,1))'"
    )

    cmd = [
        "ffmpeg",
        "-f", "lavfi",
        "-i", f"color=c=#1a0a0f:s={WIDTH}x{HEIGHT}:d={DURATION}",
        "-vf", filter_complex,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-r", str(FPS),
        "-t", str(DURATION),
        "-y",  # overwrite
        OUTPUT
    ]

    # Fallback if DejaVu font not found: try without drawtext
    try:
        print("Generating video with FFmpeg...")
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print("First attempt failed. Trying simpler version (no text)...")
        # Simpler version without text
        simple_cmd = [
            "ffmpeg",
            "-f", "lavfi",
            "-i", f"color=c=#1a0a0f:s={WIDTH}x{HEIGHT}:d={DURATION}",
            "-vf", f"fade=t=in:st=0:d=2,fade=t=out:st={DURATION-2}:d=2,format=yuv420p",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-r", str(FPS),
            "-t", str(DURATION),
            "-y",
            OUTPUT
        ]
        subprocess.run(simple_cmd, check=True, capture_output=True)

    print(f"Video created: {OUTPUT}")

if __name__ == "__main__":
    check_ffmpeg()
    generate_video()
