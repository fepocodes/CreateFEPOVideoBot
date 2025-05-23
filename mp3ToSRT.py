import os
import sys
import whisper

def format_timestamp(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

if len(sys.argv) < 2:
    print("Usage: python transcribe.py NAME")
    sys.exit(1)

NAME = sys.argv[1]
REPO_FOLDER = os.path.join("..\\", NAME)
AUDIO_PATH = os.path.join(REPO_FOLDER, "public\\audio.mp3")
OUTPUT_PATH = os.path.join(REPO_FOLDER, "public\\output.srt")

model = whisper.load_model("medium")
result = model.transcribe(AUDIO_PATH)

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    for i, segment in enumerate(result["segments"]):
        start = format_timestamp(segment["start"])
        end = format_timestamp(segment["end"])
        text = segment["text"].strip()
        f.write(f"{i+1}\n{start} --> {end}\n{text}\n\n")
