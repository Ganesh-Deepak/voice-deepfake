"""Watch an episode the way a viewer would, as images and numbers a reviewer can read.

    pip install playwright pillow && playwright install chromium
    python tools/review/review.py xlsr --out review/xlsr/round-1 [--root <site dir>] [--scenes x_conv,x_mha]

Writes, per scene:
  storyboard-NN-<id>.jpg   a frame every ~2 s with the sentence being spoken under it (sync, clarity)
  motion-NN-<id>.jpg       8 fps strips at every beat start (how things move in)
  cut-NN.jpg               8 frames across each scene boundary
and for the whole episode:
  metrics.md / metrics.json  pacing (words per minute per beat, pauses), text shown too briefly to read,
                             text drawn too small, motion energy (dead or hectic stretches)

Frame sampling follows nl-video-score's tiers (overview, critical-motion windows, transitions);
the review itself follows tools/review/rubric.md.
"""
import argparse
import asyncio
import base64
import functools
import http.server
import io
import json
import os
import re
import textwrap
import threading

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TW, TH, CAP = 640, 360, 92          # storyboard tile and caption band (px)


def serve(root):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=root))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def font(size):
    for name in ("segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def tile(img_bytes, label, caption):
    im = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((TW, TH))
    out = Image.new("RGB", (TW, TH + CAP), (14, 18, 28))
    out.paste(im, (0, 0))
    d = ImageDraw.Draw(out)
    d.rectangle([0, 0, 118, 26], fill=(0, 0, 0))
    d.text((6, 4), label, fill=(120, 230, 255), font=font(17))
    lines = textwrap.wrap(caption or "(no narration)", 78)[:4]
    for i, ln in enumerate(lines):
        d.text((8, TH + 6 + i * 21), ln, fill=(235, 238, 245) if caption else (120, 130, 150), font=font(16))
    return out


def sheet(tiles, cols=4):
    rows = (len(tiles) + cols - 1) // cols
    w, h = tiles[0].size
    out = Image.new("RGB", (w * cols, h * rows), (6, 8, 12))
    for i, t in enumerate(tiles):
        out.paste(t, ((i % cols) * w, (i // cols) * h))
    return out


TEXT_HOOK = r"""
(step) => {
  const c = document.getElementById('c');
  const orig = CanvasRenderingContext2D.prototype.fillText;
  const seen = {};
  let cur = 0, sc = null;
  CanvasRenderingContext2D.prototype.fillText = function (s, x, y, mw) {
    s = String(s);
    if (this.globalAlpha > 0.35 && s.trim().length >= 4) {
      const m = /(\d+(?:\.\d+)?)px/.exec(this.font), px = m ? +m[1] : 0;
      const k = s.trim();
      const r = seen[k] || (seen[k] = { first: cur, last: cur, px: 1e9, scene: sc, n: 0 });
      r.last = cur; r.px = Math.min(r.px, px); r.n++;
    }
    return orig.call(this, s, x, y, mw);
  };
  // motion energy: mean absolute luminance change between successive frames, downscaled
  const small = document.createElement('canvas'); small.width = 160; small.height = 90;
  const g = small.getContext('2d', { willReadFrequently: true });
  let prev = null; const energy = [];
  for (cur = 0; cur < E.TL.total; cur += step) {
    sc = E.TL.scenes.find(s2 => cur < s2.start + s2.dur).scene.id;
    E.renderAt(cur);
    g.drawImage(c, 0, 0, 160, 90);
    const d = g.getImageData(0, 0, 160, 90).data;
    if (prev) { let s = 0; for (let i = 0; i < d.length; i += 4) s += Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2]); energy.push([+cur.toFixed(2), sc, s / (160 * 90 * 3)]); }
    prev = d;
  }
  CanvasRenderingContext2D.prototype.fillText = orig;
  return { seen, energy };
}
"""


async def run(a):
    from playwright.async_api import async_playwright
    os.makedirs(a.out, exist_ok=True)
    port = serve(a.root)
    want = set(a.scenes.split(",")) if a.scenes else None
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1920, "height": 1080})
        await pg.goto(f"http://127.0.0.1:{port}/index.html?v={a.video}&render&nograin", wait_until="networkidle")
        await pg.wait_for_function("window.READY === true", timeout=120000)
        info = await pg.evaluate("E.TL.scenes.map(s => ({id: s.scene.id, title: s.scene.title, start: s.start, dur: s.dur, beats: s.beats.map(b => ({start: b.start, dur: b.dur, sentences: b.sentences}))}))")
        total = await pg.evaluate("E.TL.total")

        async def frame(t, q=0.82):
            d = await pg.evaluate(f"renderFrame({t:.4f}, {q})")
            return base64.b64decode(d[d.index(",") + 1:])

        async def cap(t):
            return await pg.evaluate(f"E.captionInfo({t:.4f}).text")

        for n, sc in enumerate(info):
            if want and sc["id"] not in want:
                continue
            # 1. storyboard: ~2 s apart, at least 8 frames
            k = max(8, int(sc["dur"] / a.step))
            tiles = []
            for i in range(k):
                t = sc["start"] + (i + 0.5) * sc["dur"] / k
                tiles.append(tile(await frame(t), f"{t - sc['start']:6.1f}s", await cap(t)))
            sheet(tiles).save(os.path.join(a.out, f"storyboard-{n:02d}-{sc['id']}.jpg"), quality=80)
            # 2. motion strips: 8 frames at 8 fps from each beat start
            strips = []
            for bi, bt in enumerate(sc["beats"]):
                for j in range(8):
                    t = sc["start"] + bt["start"] + 0.25 + j / 8
                    strips.append(tile(await frame(t, 0.7), f"b{bi} +{0.25 + j / 8:.2f}", ""))
            sheet(strips, cols=8).resize((TW * 4, int((TH + CAP) * 4 / 8 * ((len(strips) + 7) // 8)))).save(os.path.join(a.out, f"motion-{n:02d}-{sc['id']}.jpg"), quality=72)
            # 3. the cut into this scene
            if n:
                cut = [tile(await frame(sc["start"] + dt, 0.7), f"cut {dt:+.2f}", "") for dt in (-0.45, -0.3, -0.15, -0.05, 0.05, 0.15, 0.3, 0.6)]
                sheet(cut, cols=8).resize((TW * 4, (TH + CAP) // 2)).save(os.path.join(a.out, f"cut-{n:02d}.jpg"), quality=72)
            print(f"\r{a.video}: scene {n + 1}/{len(info)}", end="", flush=True)
        print()
        probe = await pg.evaluate(TEXT_HOOK, a.probe)
        await b.close()

    # ---------------- metrics ----------------
    rows, flags = [], []
    for sc in info:
        words = sum(len(s["text"].split()) for b in sc["beats"] for s in b["sentences"])
        speech = sum(s["dur"] for b in sc["beats"] for s in b["sentences"])
        beat_wpm = [round(60 * sum(len(s["text"].split()) for s in b["sentences"]) / b["dur"]) for b in sc["beats"]]
        rows.append({"id": sc["id"], "title": sc["title"], "dur": round(sc["dur"], 1), "words": words,
                     "wpm_overall": round(60 * words / sc["dur"]), "wpm_speech": round(60 * words / max(1, speech)),
                     "beat_wpm": beat_wpm, "beats": len(sc["beats"])})
    seen = probe["seen"]
    numeric = re.compile(r"^[\d.,\s%MK×()+\-−/:]+$")
    brief, tiny = [], []
    for s, r in seen.items():
        if numeric.match(s) or len(s) < 10:
            continue
        life = r["last"] - r["first"] + a.probe
        need = 0.9 + len(s) / 14.0
        longer = any(o != s and o.startswith(s) for o in seen)   # a typing animation's intermediate state
        if life < need and not longer:
            brief.append({"text": s[:80], "scene": r["scene"], "seconds": round(life, 2), "needs": round(need, 1)})
        if r["px"] < 20 and len(s) > 14:
            tiny.append({"text": s[:80], "scene": r["scene"], "px": r["px"]})
    en = probe["energy"]
    dead, busy, run_dead, run_busy = [], [], None, None
    for t, sc, e in en:
        if e < 0.25:
            run_dead = run_dead or (t, sc)
        else:
            if run_dead and t - run_dead[0] >= 6:
                dead.append({"scene": run_dead[1], "from": run_dead[0], "seconds": round(t - run_dead[0], 1)})
            run_dead = None
        if e > 6:
            run_busy = run_busy or (t, sc)
        else:
            if run_busy and t - run_busy[0] >= 1.5:
                busy.append({"scene": run_busy[1], "from": run_busy[0], "seconds": round(t - run_busy[0], 1)})
            run_busy = None
    report = {"video": a.video, "total_min": round(total / 60, 2), "scenes": rows, "text_too_brief": brief,
              "text_too_small": tiny, "dead_stretches": dead, "hectic_stretches": busy}
    json.dump(report, open(os.path.join(a.out, "metrics.json"), "w", encoding="utf8"), indent=1, ensure_ascii=False)
    with open(os.path.join(a.out, "metrics.md"), "w", encoding="utf8") as f:
        f.write(f"# {a.video} metrics ({report['total_min']} min)\n\n| scene | dur s | words | wpm (overall / speech) | beat wpm |\n|---|---|---|---|---|\n")
        for r in rows:
            f.write(f"| {r['id']} | {r['dur']} | {r['words']} | {r['wpm_overall']} / {r['wpm_speech']} | {r['beat_wpm']} |\n")
        f.write(f"\n## Text on screen shorter than its reading time ({len(brief)})\n")
        for x in sorted(brief, key=lambda x: x["seconds"] - x["needs"])[:40]:
            f.write(f"- [{x['scene']}] {x['seconds']} s (needs {x['needs']} s): {x['text']}\n")
        f.write(f"\n## Message text under 20 px ({len(tiny)})\n")
        for x in tiny[:40]:
            f.write(f"- [{x['scene']}] {x['px']} px: {x['text']}\n")
        f.write(f"\n## Dead stretches ≥ 6 s ({len(dead)})\n")
        for x in dead:
            f.write(f"- [{x['scene']}] from {x['from']} s for {x['seconds']} s\n")
        f.write(f"\n## Hectic stretches ≥ 1.5 s of heavy motion ({len(busy)})\n")
        for x in busy:
            f.write(f"- [{x['scene']}] from {x['from']} s for {x['seconds']} s\n")
    print(f"wrote {a.out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", required=True)
    ap.add_argument("--root", default=ROOT)
    ap.add_argument("--scenes", default="")
    ap.add_argument("--step", type=float, default=2.2, help="storyboard spacing in seconds")
    ap.add_argument("--probe", type=float, default=0.25, help="text/motion probe spacing in seconds")
    asyncio.run(run(ap.parse_args()))
