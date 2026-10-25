from pathlib import Path
import math
import wave
import numpy as np

SR = 32000
BPM = 60.0
BEAT = 60.0 / BPM
LOOP_SECONDS = 32.0
CROSSFADE_SECONDS = 2.0
TOTAL_SECONDS = LOOP_SECONDS + CROSSFADE_SECONDS
N = int(TOTAL_SECONDS * SR)
t = np.arange(N, dtype=np.float64) / SR
rng = np.random.default_rng(64064)

# A minor / C major add9 colour. Four 8-second colour fields.
CHORDS = [
    {"name": "Am9", "root": 110.00, "notes": [220.00, 261.63, 329.63, 392.00, 493.88], "bell": 880.00},
    {"name": "Fmaj7", "root": 87.31, "notes": [174.61, 220.00, 261.63, 329.63], "bell": 698.46},
    {"name": "Cmaj9", "root": 130.81, "notes": [196.00, 261.63, 293.66, 392.00], "bell": 783.99},
    {"name": "G6/9", "root": 98.00, "notes": [196.00, 246.94, 293.66, 329.63, 440.00], "bell": 987.77},
]

audio = np.zeros(N, dtype=np.float64)
pad = np.zeros(N, dtype=np.float64)
arp = np.zeros(N, dtype=np.float64)
bass = np.zeros(N, dtype=np.float64)
bells = np.zeros(N, dtype=np.float64)

for ci, chord in enumerate(CHORDS):
    start = ci * 8.0
    end = start + 8.0
    a = int(start * SR)
    b = int(end * SR)
    tt = t[a:b] - start
    n = b - a

    # Warm, slowly breathing pad. A little detune keeps it from sounding sterile.
    attack = np.minimum(tt / 2.2, 1.0)
    release = np.minimum((8.0 - tt) / 2.4, 1.0)
    env = np.clip(attack, 0, 1) * np.clip(release, 0, 1)
    breath = 0.72 + 0.28 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.055 * tt + ci))
    for vi, freq in enumerate(chord["notes"]):
        vib = 1.0 + 0.0016 * np.sin(2 * np.pi * (0.11 + vi * 0.017) * tt + vi)
        detune = 1.0 + 0.0007 * math.sin(ci * 1.7 + vi)
        wave1 = np.sin(2 * np.pi * freq * vib * tt)
        wave2 = np.sin(2 * np.pi * freq * detune * 0.9985 * tt + 0.9)
        overtone = 0.18 * np.sin(2 * np.pi * freq * 2.002 * tt + 0.3)
        pad[a:b] += (wave1 * 0.62 + wave2 * 0.38 + overtone) * env * breath * (0.16 - vi * 0.012)

    # Sparse eighth-note arpeggio, high and glassy, with two soft echoes.
    pattern = [0, 2, 4, 1, 3, 2, 4, 3, 0, 2, 1, 3, 4, 2, 3, 1]
    step = 0.5
    for k, deg in enumerate(pattern):
        when = k * step
        if when >= 7.5:
            continue
        freq = chord["notes"][deg % len(chord["notes"])] * 2.0
        at = a + int(when * SR)
        dur = int(1.15 * SR)
        if at + dur > N:
            dur = N - at
        tau = np.arange(dur, dtype=np.float64) / SR
        env_a = np.exp(-tau * 4.2)
        tone = np.sin(2 * np.pi * freq * tau) + 0.24 * np.sin(2 * np.pi * freq * 2.01 * tau)
        note = tone * env_a * (0.055 if k % 4 else 0.075)
        arp[at:at + dur] += note
        for delay, gain in ((0.375, 0.34), (0.75, 0.13)):
            at2 = at + int(delay * SR)
            if at2 + dur <= N:
                arp[at2:at2 + dur] += note * gain

    # Very slow sub pulse on each bar, like a distant engine.
    for bar in range(2):
        when = bar * 4.0
        at = a + int(when * SR)
        dur = int(3.4 * SR)
        if at + dur > N:
            dur = N - at
        tau = np.arange(dur, dtype=np.float64) / SR
        env_b = (1 - np.exp(-tau * 2.6)) * np.exp(-tau * 1.05)
        tone = np.sin(2 * np.pi * chord["root"] * 0.5 * tau) + 0.22 * np.sin(2 * np.pi * chord["root"] * tau)
        bass[at:at + dur] += tone * env_b * 0.13

    # A bell-like marker at the end of each colour field.
    bell_at = a + int(2.1 * SR)
    bell_dur = int(3.4 * SR)
    if bell_at + bell_dur > N:
        bell_dur = N - bell_at
    tau = np.arange(bell_dur, dtype=np.float64) / SR
    bell_env = np.exp(-tau * 1.6)
    fm = np.sin(2 * np.pi * chord["bell"] * tau + 0.9 * np.sin(2 * np.pi * chord["bell"] * 0.5 * tau) * np.exp(-tau * 2.8))
    bells[bell_at:bell_at + bell_dur] += fm * bell_env * 0.038

# Slow filtered wind, generated at a low rate then interpolated. It is intentionally quiet.
wind_rate = 100
wind_points = int(TOTAL_SECONDS * wind_rate)
wind_low = rng.normal(0, 1, wind_points)
wind_low = np.convolve(wind_low, np.ones(13) / 13, mode="same")
wind = np.interp(np.linspace(0, wind_points - 1, N), np.arange(wind_points), wind_low)
wind *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.017 * t + 0.8)
wind *= 0.011

audio += pad + arp + bass + bells + wind

# Trim the high-frequency digital edge without scipy: a short symmetric moving average.
audio = np.convolve(audio, np.ones(5) / 5, mode="same")

# Make the last two seconds feed into the first two seconds so the loop is seamless.
loop_n = int(LOOP_SECONDS * SR)
xf_n = int(CROSSFADE_SECONDS * SR)
loop = audio[:loop_n].copy()
tail = audio[loop_n:loop_n + xf_n]
for i in range(xf_n):
    w = i / max(1, xf_n - 1)
    loop[i] = loop[i] * w + tail[i] * (1 - w)

# Gentle limiter / normalization.
peak = float(np.max(np.abs(loop))) or 1.0
loop = loop / peak * 0.72
loop = np.tanh(loop * 1.18) * 0.92
pcm = np.clip(loop * 32767, -32768, 32767).astype(np.int16)

out = Path(__file__).resolve().parent.parent / "assets" / "bgm-colony.wav"
with wave.open(str(out), "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())
print(f"wrote {out} ({out.stat().st_size} bytes, {LOOP_SECONDS:.0f}s loop, {SR} Hz mono)")
