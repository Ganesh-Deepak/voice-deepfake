"""Render an episode to MP4: deterministic frames from the player, plus the soundtrack.

    pip install playwright numpy soundfile scipy && playwright install chromium
    python tools/render.py w2v2 --out out/ep1-wav2vec2.mp4 [--fps 30] [--crf 21] [--from 0 --to 60]

Frames come from index.html?render (the same renderAt(t) the web player uses), so the
video matches the site frame for frame. Audio = narration.mp3 (voice + SFX) + the music
loop, ducked under the voice using the caption timings in build/<vid>/timeline.js.
"""
import argparse
import asyncio
import base64
import functools
import http.server
import json
import os
import subprocess
import sys
import tempfile
import threading

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASR = 48000


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def decode(path, sr, ch):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", str(ch), "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch)


def soundtrack(vid, t0, t1, out_wav):
    src = open(os.path.join(ROOT, "build", vid, "timeline.js"), encoding="utf8").read()
    tl = json.loads(src[src.index("{"):src.rindex("}") + 1])
    voice = decode(os.path.join(ROOT, "build", vid, "narration.mp3"), ASR, 1)[:, 0]
    music = decode(os.path.join(ROOT, "build", "music.mp3"), ASR, 2)
    n = len(voice)
    reps = int(np.ceil(n / len(music))) + 1
    music = np.tile(music, (reps, 1))[:n]
    # ducking envelope from the sentence timings (same levels as the web player)
    speak = np.zeros(n, dtype=np.float32)
    t = 0.0
    for s in tl["scenes"]:
        bt = t + s["lead"]
        for b in s["beats"]:
            for se in b["sentences"]:
                a, z = int((bt + se["start"] - 0.05) * ASR), int((bt + se["start"] + se["dur"] + 0.3) * ASR)
                speak[max(0, a):min(n, z)] = 1
            bt += b["dur"]
        t += s["lead"] + sum(b["dur"] for b in s["beats"]) + s["tail"]
    k = np.exp(-1 / (0.35 * ASR))
    from scipy.signal import lfilter
    lvl = lfilter([1 - k], [1, -k], np.where(speak > 0, 0.32, 0.62).astype(np.float64))
    fade = np.clip(np.arange(n) / (1.5 * ASR), 0, 1) * np.clip((n - np.arange(n)) / (2.0 * ASR), 0, 1)
    mix = voice[:, None] + music * (lvl * fade)[:, None]
    mix = mix[int(t0 * ASR):int(t1 * ASR)]
    sf.write(out_wav, np.clip(mix, -1, 1).astype(np.float32), ASR, subtype="FLOAT")


async def frames(vid, fps, t0, t1, ffmpeg_in):
    from playwright.async_api import async_playwright
    port = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--disable-gpu-vsync", "--disable-frame-rate-limit"])
        pg = await b.new_page(viewport={"width": 1920, "height": 1080})
        await pg.goto(f"http://127.0.0.1:{port}/index.html?v={vid}&render&nograin", wait_until="networkidle")
        await pg.wait_for_function("window.READY === true", timeout=120000)
        total = await pg.evaluate("window.TOTAL")
        t1 = min(t1, total)
        n = int((t1 - t0) * fps)
        for i in range(n):
            data = await pg.evaluate(f"renderFrame({t0 + i / fps:.5f}, 0.92)")
            ffmpeg_in.write(base64.b64decode(data[data.index(",") + 1:]))
            if i % (fps * 10) == 0:
                print(f"\r{vid}: {i / fps:7.1f}/{t1 - t0:.0f}s", end="", file=sys.stderr, flush=True)
        await b.close()
    print(file=sys.stderr)
    return t1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--crf", type=int, default=23)
    ap.add_argument("--from", dest="t0", type=float, default=0.0)
    ap.add_argument("--to", dest="t1", type=float, default=1e9)
    a = ap.parse_args()
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        silent = os.path.join(td, "video.mp4")
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", str(a.fps), "-i", "-",
                                "-c:v", "libx264", "-preset", "faster", "-crf", str(a.crf), "-pix_fmt", "yuv420p",
                                "-tune", "animation", "-movflags", "+faststart", silent], stdin=subprocess.PIPE)
        t1 = asyncio.run(frames(a.video, a.fps, a.t0, a.t1, enc.stdin))
        enc.stdin.close()
        enc.wait()
        wav = os.path.join(td, "audio.wav")
        soundtrack(a.video, a.t0, t1, wav)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
                        "-shortest", "-movflags", "+faststart", a.out], check=True)
    print(f"wrote {a.out}")


if __name__ == "__main__":
    main()
