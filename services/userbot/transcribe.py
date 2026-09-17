#!/usr/bin/env python3
"""
Local Speech-To-Text transcriber using faster-whisper (tiny/base).
Zero cloud cost, zero billing requirements, supports RU, UK, EN, PL, DE, RO, etc.
"""

import os
import sys
import json
from faster_whisper import WhisperModel

MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")
# Device cpu with int8 quantization for ultra-fast response
model = None

def get_model():
    global model
    if model is None:
        model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    return model

def transcribe(file_path: str):
    if not os.path.exists(file_path):
        return {"ok": False, "error": f"File not found: {file_path}"}

    try:
        wm = get_model()
        segments, info = wm.transcribe(file_path, beam_size=5)
        text_list = [segment.text.strip() for segment in segments]
        full_text = " ".join(text_list).strip()
        return {
            "ok": True,
            "transcript": full_text,
            "language": info.language,
            "probability": info.language_probability,
            "duration": info.duration
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Usage: transcribe.py <audio_path>"}))
        sys.exit(1)

    audio_path = sys.argv[1]
    res = transcribe(audio_path)
    print(json.dumps(res, ensure_ascii=False))
