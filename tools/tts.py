"""Narration builder: scene beats -> Kokoro speech -> build/<vid>/timeline.js + voice WAV.

    pip install kokoro-onnx soundfile numpy
    # model files: kokoro-v1.0.onnx, voices-v1.0.bin from
    # https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    python tools/tts.py xlsr --models <dir> --cache <dir> --wav <out.wav>

Each sentence is synthesized on its own (cached by text), silences are trimmed, and the
sentences are laid out with fixed gaps. The timeline stores the caption text, which is the
spoken text with letter-by-letter spellings folded back (X L S R -> XLS-R).
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

SR = 24000
VOICE, SPEED = "af_heart", 1.0
GAP = 0.34          # between sentences inside a beat
BEAT_TAIL = 0.62    # after the last sentence of a beat
LEAD = 1.45         # scene start -> first word (room for the chapter title card)
LEAD_NO_HEADER = 1.1
TAIL = 1.05
TAIL_LAST = 6.0     # room for the end card

# Spoken text -> what the TTS actually reads (pronunciation only).
SAY = [
    (r"\bwav2vec 2\.0\b", "wave two vek two point oh"),
    (r"\bwav2vec2\b", "wave two vek two"),
    (r"\bwav2vec\b", "wave two vek"),
    (r"\bSwiGLU", "swig-loo"),
    (r"\bRMSNorm\b", "R M S norm"),
    (r"\btanh\b", "tanch"),
    (r"\bASVspoof\b", "ASV spoof"),
    (r"\bGELU\b", "gee-loo"),
    (r"\bSSL-AASIST\b", "S S L A-assist"),
    (r"\bS S L A A SIST\b", "S S L A-assist"),
    (r"\bA A SIST\b", "A-assist"),
    (r"\bAASIST\b", "A-assist"),
    (r"\bH S G A L\b", "H S G eh L"),
    (r"times A, where A is", "times eh, where eh is"),
]

# Spoken text -> caption text.
SHOW = [
    ("S S L A A SIST", "SSL-AASIST"),
    ("A A SIST", "AASIST"),
    ("X L S R", "XLS-R"),
    ("H S G A L", "HS-GAL"),
    ("mamba s s m", "mamba_ssm"),
    ("Adam W", "AdamW"),
    (r"\bL L\b", "LL"),
    (r"\b2021 L A\b", "2021 LA"),
    (r"\bL A\b", "LA"),
    (r"\bD F\b", "DF"),
    (r"\bq t\b", "q_t"),
    (r"\bc t\b", "c_t"),
]


def split_sentences(text):
    return [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s]


def to_speech(s):
    for pat, rep in SAY:
        s = re.sub(pat, rep, s)
    return s


def to_caption(s):
    for pat, rep in SHOW:
        s = re.sub(pat, rep, s)
    return s


def trim(a, floor_db=-42.0, pad=0.035):
    env = np.abs(a)
    th = (10 ** (floor_db / 20)) * max(1e-6, env.max())
    idx = np.where(env > th)[0]
    if not len(idx):
        return a
    i0 = max(0, idx[0] - int(pad * SR))
    i1 = min(len(a), idx[-1] + int(pad * SR * 2))
    out = a[i0:i1].copy()
    fade = min(len(out) // 4, int(0.012 * SR))
    if fade > 0:
        out[:fade] *= np.linspace(0, 1, fade)
        out[-fade:] *= np.linspace(1, 0, fade)
    return out


class Voice:
    def __init__(self, models, cache):
        from kokoro_onnx import Kokoro
        self.k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
        self.cache = cache
        os.makedirs(cache, exist_ok=True)

    def say(self, text):
        key = hashlib.sha1(f"{VOICE}|{SPEED}|{text}".encode()).hexdigest()[:20]
        path = os.path.join(self.cache, key + ".npy")
        if os.path.exists(path):
            return np.load(path)
        a, sr = self.k.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        assert sr == SR
        a = trim(np.asarray(a, dtype=np.float32))
        np.save(path, a)
        return a


def r3(x):
    return round(x + 1e-9, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--models", required=True)
    ap.add_argument("--cache", required=True)
    ap.add_argument("--wav", required=True)
    args = ap.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    beats = json.loads(subprocess.run(["node", os.path.join(root, "tools", "export_beats.js"), args.video],
                                      capture_output=True, text=True, encoding="utf8", check=True).stdout)
    voice = Voice(args.models, args.cache)

    tl_scenes, clips, t0 = [], [], 0.0
    n_sent = sum(len(split_sentences(b)) for s in beats["scenes"] for b in s["beats"])
    done = 0
    for sc in beats["scenes"]:
        lead = LEAD_NO_HEADER if sc["noHeader"] else LEAD
        bt, out_beats = lead, []
        for text in sc["beats"]:
            st, sents = 0.0, []
            for s in split_sentences(text):
                a = voice.say(to_speech(s))
                d = r3(len(a) / SR)
                sents.append({"text": to_caption(s), "start": r3(st), "dur": d})
                clips.append((t0 + bt + st, a))
                st = r3(st + d + GAP)
                done += 1
                print(f"\r{args.video}: {done}/{n_sent}", end="", file=sys.stderr, flush=True)
            dur = r3(st - GAP + BEAT_TAIL)
            out_beats.append({"dur": dur, "sentences": sents})
            bt = r3(bt + dur)
        tail = TAIL_LAST if sc is beats["scenes"][-1] else TAIL
        tl_scenes.append({"id": sc["id"], "lead": lead, "tail": tail, "beats": out_beats})
        t0 = r3(t0 + bt + tail)
    print(file=sys.stderr)

    total = t0
    wav = np.zeros(int(np.ceil(total * SR)) + SR, dtype=np.float32)
    for start, a in clips:
        i = int(round(start * SR))
        wav[i:i + len(a)] += a
    os.makedirs(os.path.dirname(os.path.abspath(args.wav)), exist_ok=True)
    sf.write(args.wav, wav[:int(np.ceil(total * SR))], SR, subtype="FLOAT")

    out = os.path.join(root, "build", args.video, "timeline.js")
    with open(out, "w", encoding="utf8", newline="\n") as f:
        f.write("window.TIMELINE = " + json.dumps({"scenes": tl_scenes, "voice": VOICE, "total": total},
                                                  separators=(",", ":")) + ";\n")
    print(f"{args.video}: {len(tl_scenes)} scenes, {total / 60:.2f} min -> {out}")


if __name__ == "__main__":
    main()
