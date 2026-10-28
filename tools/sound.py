"""Sound design: voice polish + synthesized SFX on the scene cuts, and an ambient music loop.

    pip install numpy scipy soundfile pyloudnorm
    python tools/sound.py mix   <vid> --voice <voice.wav> --out build/<vid>/narration.mp3
    python tools/sound.py music --out build/music.mp3

Everything is synthesized here (no samples), so the soundtrack is reproducible. The SFX are
timed from build/<vid>/timeline.js with the same constants the engine uses for its seams and
chapter cards, so sound and motion land on the same frame.
"""
import argparse
import json
import os
import subprocess
import tempfile

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 32000            # narration track: mono 32 kHz (keeps whoosh air, fits the size budget)
MSR = 44100           # music loop: stereo 44.1 kHz
RNG = np.random.default_rng(7)

# keep in sync with src/engine.js
OUT_DUR, CARD_DOCK = 0.34, 0.98


# ---------------------------------------------------------------- dsp helpers
def bq(x, kind, f, sr, q=0.707, gain_db=0.0):
    """RBJ biquad (lowpass, highpass, bandpass, peak, highshelf, lowshelf)."""
    A, w0 = 10 ** (gain_db / 40), 2 * np.pi * f / sr
    al, c = np.sin(w0) / (2 * q), np.cos(w0)
    if kind == "lowpass":
        b, a = [(1 - c) / 2, 1 - c, (1 - c) / 2], [1 + al, -2 * c, 1 - al]
    elif kind == "highpass":
        b, a = [(1 + c) / 2, -(1 + c), (1 + c) / 2], [1 + al, -2 * c, 1 - al]
    elif kind == "bandpass":
        b, a = [al, 0, -al], [1 + al, -2 * c, 1 - al]
    elif kind == "peak":
        b, a = [1 + al * A, -2 * c, 1 - al * A], [1 + al / A, -2 * c, 1 - al / A]
    elif kind == "highshelf":
        sa = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * c + sa), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sa)]
        a = [(A + 1) - (A - 1) * c + sa, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sa]
    elif kind == "lowshelf":
        sa = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * c + sa), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sa)]
        a = [(A + 1) + (A - 1) * c + sa, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sa]
    else:
        raise ValueError(kind)
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def sweep_bp(x, f0, f1, sr, q=1.2, block=256):
    """Band-pass with a centre frequency sweeping exponentially from f0 to f1."""
    out, zi, n = np.zeros_like(x), np.zeros(2), len(x)
    for i in range(0, n, block):
        f = f0 * (f1 / f0) ** (i / max(1, n - 1))
        w0 = 2 * np.pi * min(f, sr * 0.45) / sr
        al, c = np.sin(w0) / (2 * q), np.cos(w0)
        b, a = np.array([al, 0, -al]) / (1 + al), np.array([1, -2 * c / (1 + al), (1 - al) / (1 + al)])
        out[i:i + block], zi = signal.lfilter(b, a, x[i:i + block], zi=zi)
    return out


def env(n, a, d, sr, shape=3.0):
    t = np.arange(n) / sr
    e = np.where(t < a, (t / max(a, 1e-4)) ** 2, np.exp(-(t - a) / max(d, 1e-4) * shape / 3))
    return e


def compress(x, sr, thr_db=-22, ratio=2.6, att=0.006, rel=0.12, makeup_db=3.0):
    lev = np.abs(x)
    ka, kr = np.exp(-1 / (att * sr)), np.exp(-1 / (rel * sr))
    e = signal.lfilter([1 - kr], [1, -kr], lev)  # smooth follower (release-dominated)
    e = np.maximum(e, signal.lfilter([1 - ka], [1, -ka], lev) * 0.0)
    db = 20 * np.log10(np.maximum(e, 1e-6))
    over = np.maximum(0, db - thr_db)
    g = 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)
    return x * g


def limit(x, ceiling_db=-1.2):
    c = 10 ** (ceiling_db / 20)
    peak = np.max(np.abs(x))
    if peak > c:
        # soft knee: tanh above 70 % of the ceiling
        k = 0.7 * c
        y = np.where(np.abs(x) > k, np.sign(x) * (k + (c - k) * np.tanh((np.abs(x) - k) / (c - k))), x)
        return y
    return x


# ---------------------------------------------------------------- sfx
def whoosh(sr, dur=0.62, f0=380, f1=4200, level=0.22):
    n = int(dur * sr)
    x = RNG.standard_normal(n)
    x = sweep_bp(x, f0, f1, sr, q=1.3) * 0.8 + sweep_bp(x, f0 * 2.1, f1 * 1.6, sr, q=2.2) * 0.4
    t = np.linspace(0, 1, n)
    e = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.6 * np.exp(-1.2 * t)
    return x * e / (np.max(np.abs(x * e)) + 1e-9) * level


def thump(sr, level=0.30):
    n = int(0.9 * sr)
    t = np.arange(n) / sr
    f = 46 + 70 * np.exp(-t * 22)
    ph = 2 * np.pi * np.cumsum(f) / sr
    body = np.sin(ph) * np.exp(-t * 6.5)
    click = bq(RNG.standard_normal(n), "bandpass", 1800, sr, 0.9) * np.exp(-t * 60) * 0.25
    air = bq(RNG.standard_normal(n), "lowpass", 2600, sr) * np.exp(-t * 9) * 0.08
    y = body + click + air
    return y / np.max(np.abs(y)) * level


def tick(sr, f=2300, level=0.08):
    n = int(0.09 * sr)
    t = np.arange(n) / sr
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 70) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 90)
    return y / np.max(np.abs(y)) * level


def riser(sr, dur=1.4, level=0.16):
    n = int(dur * sr)
    x = sweep_bp(RNG.standard_normal(n), 300, 6500, sr, q=2.0)
    t = np.linspace(0, 1, n)
    e = t ** 2.2 * (1 - np.clip((t - 0.93) / 0.07, 0, 1))
    return x * e / (np.max(np.abs(x * e)) + 1e-9) * level


def chime(sr, level=0.12):
    n = int(2.6 * sr)
    t = np.arange(n) / sr
    y = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(880, 1, 2.2), (1318.5, 0.5, 2.8), (1760, 0.25, 3.5), (2637, 0.12, 5)])
    return y / np.max(np.abs(y)) * level


def place(buf, clip, t, sr):
    i = int(round(t * sr))
    if i < 0:
        clip, i = clip[-i:], 0
    j = min(len(buf), i + len(clip))
    if j > i:
        buf[i:j] += clip[:j - i]


def load_timeline(vid, root):
    src = open(os.path.join(root, "build", vid, "timeline.js"), encoding="utf8").read()
    return json.loads(src[src.index("{"):src.rindex("}") + 1])


def scene_times(tl):
    out, t = [], 0.0
    for s in tl["scenes"]:
        d = s["lead"] + sum(b["dur"] for b in s["beats"]) + s["tail"]
        out.append((s["id"], t, d, s["lead"]))
        t += d
    return out, t


def mix(args):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tl = load_timeline(args.video, root)
    scenes, total = scene_times(tl)
    v, vsr = sf.read(args.voice, dtype="float64")
    if v.ndim > 1:
        v = v.mean(1)
    v = signal.resample_poly(v, SR, vsr) if vsr != SR else v
    n = int(np.ceil(total * SR)) + SR
    voice = np.zeros(n)
    voice[:len(v)] = v[:n]
    # voice polish: rumble out, a touch of warmth and presence, gentle compression
    voice = bq(voice, "highpass", 75, SR, 0.7)
    voice = bq(voice, "lowshelf", 180, SR, 0.7, 1.5)
    voice = bq(voice, "peak", 320, SR, 1.0, -1.5)
    voice = bq(voice, "peak", 3200, SR, 0.9, 2.0)
    voice = bq(voice, "highshelf", 9000, SR, 0.7, 1.0)
    voice = compress(voice, SR)
    meter = pyln.Meter(SR)
    voice *= 10 ** ((-17.0 - meter.integrated_loudness(voice[:len(v)])) / 20)

    sfx = np.zeros(n)
    W = whoosh(SR)
    for i, (sid, st, du, lead) in enumerate(scenes):
        if i == 0:
            place(sfx, riser(SR), st + lead - 1.25, SR)
            place(sfx, thump(SR, 0.26), st + lead + 0.55, SR)
            continue
        place(sfx, W, st - OUT_DUR - 0.05, SR)                 # the cut
        if lead > 1.2:                                           # chapter card lands, then docks
            place(sfx, thump(SR, 0.20), st + 0.04, SR)
            place(sfx, whoosh(SR, 0.42, 900, 5200, 0.07), st + CARD_DOCK - 0.08, SR)
            place(sfx, tick(SR, 2600, 0.05), st + CARD_DOCK + 0.42, SR)
    place(sfx, chime(SR), total - (tl["scenes"][-1]["tail"]) + 0.2, SR)

    out = limit(voice + sfx)
    out = out[:int(np.ceil(total * SR))]
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "mix.wav")
        sf.write(wav, out.astype(np.float32), SR, subtype="FLOAT")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ac", "1", "-ar", str(SR), "-c:a", "libmp3lame",
                        "-b:a", "64k", "-metadata", f"title={args.video} narration", args.out], check=True)
    print(f"{args.video}: {total / 60:.2f} min, voice {meter.integrated_loudness(voice[:len(v)]):.1f} LUFS -> {args.out}")


# ---------------------------------------------------------------- music
def music(args):
    """A 64 s ambient loop: Am9 - Fmaj7(9) - Cmaj7 - G6sus, soft pads, sub, and a sparse plucked motif."""
    bars, bar = 4, 16.0
    L = int(bars * bar * MSR)
    tail = int(8 * MSR)
    N = L + tail
    t = np.arange(N) / MSR
    out = np.zeros((N, 2))
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [[45, 57, 60, 64, 67, 71], [41, 53, 57, 60, 64, 67], [48, 55, 59, 64, 67, 71], [43, 55, 59, 62, 64, 69]]
    for ci, ch in enumerate(chords):
        s0 = int(ci * bar * MSR)
        span = int((bar + 4) * MSR)
        idx = np.arange(span)
        tt = idx / MSR
        e = np.clip(tt / 3.0, 0, 1) ** 1.5 * np.clip((bar + 4 - tt) / 5.0, 0, 1) ** 1.2
        for k, m in enumerate(ch):
            f = hz(m)
            for side, det in ((0, -0.07), (1, 0.07)):
                ph = 2 * np.pi * f * (1 + det * 0.01) * tt + k * 1.3 + side
                tone = np.sin(ph) + 0.28 * np.sin(2 * ph + 0.4) + 0.12 * np.sin(3 * ph + 1.1)
                amp = (0.09 if k == 0 else 0.05) * (1 + 0.15 * np.sin(2 * np.pi * 0.07 * tt + k))
                seg = tone * e * amp
                j = min(N, s0 + span)
                out[s0:j, side] += seg[:j - s0]
    # sub
    for ci, ch in enumerate(chords):
        s0 = int(ci * bar * MSR); span = int(bar * MSR)
        tt = np.arange(span) / MSR
        e = np.clip(tt / 1.5, 0, 1) * np.clip((bar - tt) / 1.5, 0, 1)
        out[s0:s0 + span] += (np.sin(2 * np.pi * hz(ch[0] - 12) * tt) * e * 0.10)[:, None]
    # plucked motif (sine, exp decay), sparse, panned
    rng = np.random.default_rng(3)
    beat = 60 / 72
    for ci, ch in enumerate(chords):
        for b in range(int(bar / beat)):
            if rng.random() > 0.45:
                continue
            m = ch[2 + rng.integers(0, 4)] + 12
            st = int((ci * bar + b * beat) * MSR)
            n = int(2.2 * MSR)
            tt = np.arange(n) / MSR
            p = (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(4 * np.pi * hz(m) * tt)) * np.exp(-tt * 2.6) * 0.045
            pan = rng.uniform(0.25, 0.75)
            j = min(N, st + n)
            out[st:j, 0] += p[:j - st] * (1 - pan)
            out[st:j, 1] += p[:j - st] * pan
    # gentle filtering + a long, diffuse reverb (convolution with decaying stereo noise)
    for c in range(2):
        out[:, c] = bq(bq(out[:, c], "lowpass", 3800, MSR, 0.6), "highpass", 38, MSR)
    ir_n = int(4.5 * MSR)
    ir_t = np.arange(ir_n) / MSR
    wet = np.zeros_like(out)
    for c in range(2):
        ir = np.random.default_rng(11 + c).standard_normal(ir_n) * np.exp(-ir_t * 1.5)
        ir = bq(ir, "lowpass", 3000, MSR)
        ir /= np.sqrt(np.sum(ir ** 2))
        wet[:, c] = signal.fftconvolve(out[:, c], ir)[:N]
    out = out * 0.65 + wet * 0.9
    # fold the tail onto the head so the loop is seamless
    loop = out[:L].copy()
    loop[:tail] += out[L:L + tail]
    fade = int(0.05 * MSR)
    loop /= np.max(np.abs(loop)) / 0.6
    meter = pyln.Meter(MSR)
    loop *= 10 ** ((-24.0 - meter.integrated_loudness(loop)) / 20)
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "music.wav")
        sf.write(wav, loop.astype(np.float32), MSR, subtype="FLOAT")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "128k",
                        "-metadata", "title=Deepfake detectors ambient loop", args.out], check=True)
    print(f"music loop {L / MSR:.0f} s, {meter.integrated_loudness(loop):.1f} LUFS -> {args.out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("mix"); m.add_argument("video"); m.add_argument("--voice", required=True); m.add_argument("--out", required=True)
    u = sub.add_parser("music"); u.add_argument("--out", required=True)
    a = ap.parse_args()
    mix(a) if a.cmd == "mix" else music(a)
