import asyncio
import os
import subprocess
import tempfile


def get_audio_duration(path: str) -> float:
    """Get audio duration via ffprobe."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1", path],
            capture_output=True, text=True, timeout=10
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0


async def generate_audio(text: str, voice: str, out_path: str) -> float:
    """Generate TTS audio with edge-tts. Returns duration in seconds."""
    if os.path.exists(out_path):
        dur = get_audio_duration(out_path)
        if dur > 0:
            return dur

    for attempt in range(3):
        try:
            tmp_path = out_path + ".tmp"
            cmd = [
                "edge-tts",
                "--voice", voice,
                "--text", text,
                "--write-media", tmp_path,
            ]
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode == 0 and os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 100:
                dur = get_audio_duration(tmp_path)
                if dur > 0:
                    os.rename(tmp_path, out_path)
                    return dur
                else:
                    os.remove(tmp_path)
                    print(f"edge-tts: invalid audio (attempt {attempt + 1})")
            else:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                print(f"edge-tts failed (attempt {attempt + 1}): {stderr.decode()[:200]}")
        except Exception as e:
            print(f"edge-tts exception (attempt {attempt + 1}): {e}")

        await asyncio.sleep(2)

    return 0.0
