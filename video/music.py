# Синтезована музика для трейлера: 120 BPM, 30 с, A-мінор (Am7 – Fmaj7 – Cmaj7 – G).
# Структура йде за сценами (у долях, 1 доля = 0.5 с = 15 кадрів):
#   0–6   «було»: приглушений lo-fi з тріском платівки, райзер у вайп
#   6–12  лого: удар, напівтемп, мотив дзвіночком
#   12–32 головна: house-грув; на 24–29 щодолі плак — під кожну зміну палітри
#   32–44 читалка: брейкдаун з клавішами, дзвіночки на зміні фону (36, 40)
#   44–52 «і ще»: грув повертається, «буп» на котиках, барабанний підйом
#   52–60 фінал: удар, великий акорд, хвіст
# Запуск: python music.py → public/music.wav
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt
from scipy.io import wavfile

SR = 44100
BPM = 120
BEAT = 60 / BPM
LENGTH = 30.0
N = int(LENGTH * SR)
rng = np.random.default_rng(7)

drums = np.zeros((N, 2))
music = np.zeros((N, 2))  # пади/бас — під сайдчейн
leads = np.zeros((N, 2))  # плаки/дзвіночки — у реверб
fx = np.zeros((N, 2))


def b2s(beat):
    return beat * BEAT


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def add(buf, sig, beat, gain=1.0, pan=0.0):
    i = int(b2s(beat) * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    r = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    buf[i : i + len(sig), 0] += sig * gain * l
    buf[i : i + len(sig), 1] += sig * gain * r


def filt(sig, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, sig)


def env_adsr(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


# ---------- інструменти ----------
def kick(dur=0.45):
    t = tt(dur)
    f = 45 + 115 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.3
    return np.tanh((s + click) * 1.6)


def clap():
    t = tt(0.3)
    n = filt(rng.standard_normal(len(t)), 'band', [900, 3200])
    e = np.zeros(len(t))
    for d in (0, 0.011, 0.022):
        m = t >= d
        e[m] += np.exp(-(t[m] - d) * 120)
    e += np.exp(-t * 16) * 0.5 * (t > 0.022)
    return n * e


def hat(open_=False):
    t = tt(0.25 if open_ else 0.06)
    n = filt(rng.standard_normal(len(t)), 'high', 7500)
    return n * np.exp(-t * (14 if open_ else 70))


def shaker():
    t = tt(0.09)
    n = filt(rng.standard_normal(len(t)), 'band', [4000, 9000])
    return n * np.sin(np.pi * t / t[-1]) ** 2


def snare():
    t = tt(0.22)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    n = filt(rng.standard_normal(len(t)), 'band', [1500, 8000]) * np.exp(-t * 22)
    return body * 0.5 + n


def saw(f, t, detune=0.0):
    return 2 * ((t * f * (1 + detune) + rng.random()) % 1) - 1


def pad(notes, dur, cutoff, attack=0.25):
    t = tt(dur)
    s = np.zeros(len(t))
    for m in notes:
        f = mtof(m)
        for d in (-0.008, -0.003, 0, 0.004, 0.009):
            s += saw(f, t, d)
    s = filt(s / (len(notes) * 5), 'low', cutoff)
    return s * env_adsr(len(t), attack, min(0.4, dur / 3))


def bass(m, dur):
    t = tt(dur)
    f = mtof(m)
    s = filt(saw(f, t), 'low', 420) * 0.7 + np.sin(2 * np.pi * f * t)
    return np.tanh(s * 1.2) * env_adsr(len(t), 0.004, 0.03)


def pluck(m, dur=0.7):
    t = tt(dur)
    f = mtof(m)
    s = sum(np.sin(2 * np.pi * f * k * t) / k * np.exp(-t * (4 + k * 2.2)) for k in range(1, 9))
    return s * env_adsr(len(t), 0.002, 0.05)


def bell(m, dur=2.0):
    t = tt(dur)
    f = mtof(m)
    s = (
        np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2)
        + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5)
        + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)
    )
    return s * env_adsr(len(t), 0.002, 0.1)


def keys(notes, dur):
    t = tt(dur)
    s = np.zeros(len(t))
    for m in notes:
        f = mtof(m)
        s += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3)) * np.exp(-t * 0.9)
    s *= 1 + 0.15 * np.sin(2 * np.pi * 4.5 * t)
    return s / len(notes) * env_adsr(len(t), 0.004, 0.3)


def riser(dur):
    t = tt(dur)
    n = rng.standard_normal(len(t))
    # шум, що світлішає: зшиваємо з кількох смуг
    steps = 12
    out = np.zeros(len(t))
    seg = len(t) // steps
    for k in range(steps):
        lo = 300 * 2 ** (k * 5 / steps)
        part = filt(n, 'band', [lo, min(lo * 3, 18000)])
        w = np.zeros(len(t))
        a, b = max(0, (k - 1) * seg), min(len(t), (k + 2) * seg)
        w[a:b] = np.hanning(b - a)
        out += part * w
    sweep = np.sin(2 * np.pi * np.cumsum(200 * 2 ** (t / dur * 2.5)) / SR) * 0.25
    return (out * 0.6 + sweep) * (t / dur) ** 2


def impact():
    t = tt(2.5)
    f = 60 * np.exp(-t * 1.5) + 32
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    crash = filt(rng.standard_normal(len(t)), 'high', 2500) * np.exp(-t * 2.2) * 0.35
    return np.tanh(sub * 1.5) + crash


def boop(f0):
    t = tt(0.16)
    f = f0 * 2 ** (t / 0.16 * 1.0)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * env_adsr(len(t), 0.003, 0.03)


def crackle(dur):
    t = tt(dur)
    s = np.zeros(len(t))
    idx = rng.choice(len(t), int(dur * 40), replace=False)
    s[idx] = rng.standard_normal(len(idx)) * rng.random(len(idx))
    s = filt(s, 'band', [1000, 6000])
    hiss = filt(rng.standard_normal(len(t)), 'band', [3000, 9000]) * 0.03
    return s * 3 + hiss


# ---------- акорди ----------
CH = {
    'Am7': ([57, 60, 64, 67], 45),
    'Fmaj7': ([53, 57, 60, 64], 41),
    'Cmaj7': ([52, 55, 59, 64], 48),
    'G': ([50, 55, 59, 62], 43),
    'Am9': ([57, 60, 64, 71], 45),
}
PROG = ['Am7', 'Fmaj7', 'Cmaj7', 'G']

kicks = []


def K(beat, g=1.0):
    add(drums, kick(), beat, 0.95 * g)
    kicks.append(b2s(beat))


# ===== 0–6: «було» — приглушено, як зі старого радіо =====
old = np.zeros((N, 2))
for beat, name in ((0, 'Am7'), (4, 'Fmaj7')):
    add(old, pad(CH[name][0], b2s(2 if beat == 4 else 4) + 0.3, 700, 0.05), beat, 0.55)
for beat in (0, 2.5, 4):
    add(old, kick(), beat, 0.6)
for beat in (1, 3, 5):
    add(old, snare(), beat, 0.35)
for k in range(11):
    add(old, hat(), k * 0.5, 0.12)
add(old, crackle(3.0), 0, 0.12)
old = np.stack([filt(old[:, c], 'low', 1100) for c in range(2)], axis=1)
music += old
add(fx, riser(b2s(2.6)), 3.25, 0.35)

# ===== 6–12: лого =====
add(fx, impact(), 6, 0.9)
add(music, pad(CH['Am7'][0], b2s(4) + 0.4, 2400, 0.02), 6, 0.6)
add(music, pad(CH['G'][0], b2s(2) + 0.4, 2400, 0.05), 10, 0.6)
add(music, bass(45, b2s(3.5)), 6, 0.45)
add(music, bass(43, b2s(1.8)), 10, 0.45)
for beat in (6, 8, 10, 11, 11.5):
    K(beat)
add(drums, clap(), 8, 0.5)
add(drums, clap(), 10, 0.5)
for k, m in enumerate([76, 79, 81, 84]):
    add(leads, bell(m), 9 + k * 0.5, 0.18, -0.3 + k * 0.2)
add(fx, riser(b2s(2)), 10, 0.25)

# ===== 12–32: головна, house =====
for bar in range(5):
    start = 12 + bar * 4
    name = PROG[bar % 4] if bar < 4 else 'Am7'
    notes, root = CH[name]
    add(music, pad(notes, b2s(4) + 0.3, 3000, 0.08), start, 0.5)
    for k in range(4):
        b = start + k
        K(b)
        add(music, bass(root, b2s(0.42)), b + 0.5, 0.5)
        if k % 2 == 1:
            add(drums, clap(), b, 0.55)
        add(drums, hat(True), b + 0.5, 0.16, 0.2)
        for q in (0.25, 0.75):
            add(drums, hat(), b + q, 0.09, -0.25)
    # акордові «стаби» на синкопах
    for off in (1.75, 3.25):
        add(leads, pluck(notes[-1] + 12, 0.35), start + off, 0.12, 0.35)
# під кожну зміну палітри — плак вгору
for k, m in enumerate([69, 72, 76, 79, 81, 84]):
    add(leads, pluck(m, 0.9), 24 + k, 0.32, -0.5 + k * 0.2)
add(fx, riser(b2s(2)), 30, 0.3)

# ===== 32–44: читалка, брейкдаун =====
add(fx, impact() * 0.5, 32, 0.5)
for bar, name in enumerate(['Fmaj7', 'Cmaj7', 'G']):
    start = 32 + bar * 4
    notes, root = CH[name]
    add(music, pad(notes, b2s(4) + 0.4, 1300, 0.3), start, 0.45)
    add(music, bass(root, b2s(3.8)) * 0.8, start, 0.4)
    for k in range(0, 4):
        add(leads, keys([n + 12 for n in notes[:3]], b2s(1.6)), start + k + (0.5 if k % 2 else 0), 0.16)
    for k in range(8):
        add(drums, shaker(), start + k * 0.5, 0.1 if k % 2 else 0.06, 0.3)
add(leads, pluck(84, 0.3), 33, 0.12)
add(leads, bell(88), 36, 0.3, 0.2)
add(leads, bell(93), 40, 0.3, -0.2)
add(fx, riser(b2s(3)), 41, 0.35)

# ===== 44–52: «і ще купа всього» + підйом =====
for bar, name in enumerate(['Am7', 'Fmaj7']):
    start = 44 + bar * 4
    notes, root = CH[name]
    add(music, pad(notes, b2s(4) + 0.3, 2800, 0.05), start, 0.5)
    for k in range(4):
        b = start + k
        K(b)
        add(music, bass(root, b2s(0.42)), b + 0.5, 0.5)
        if k % 2 == 1:
            add(drums, clap(), b, 0.5)
        add(drums, hat(True), b + 0.5, 0.15, 0.2)
# котики вилітають з інтервалом 4 кадри
for k in range(4):
    add(leads, boop(700 + k * 140), 48 + k * 4 / 15, 0.3, [-0.6, 0.6, -0.4, 0.4][k])
# дріб малим барабаном: вісімки → шістнадцятки
for k in range(4):
    add(drums, snare(), 50 + k * 0.25, 0.18 + k * 0.02)
for k in range(4):
    add(drums, snare(), 51 + k * 0.125 * 2, 0.26 + k * 0.03)
for k in range(4):
    add(drums, snare(), 51.5 + k * 0.125, 0.34 + k * 0.03)
add(fx, riser(b2s(4)), 48, 0.45)

# ===== 52–60: фінал =====
add(fx, impact(), 52, 1.0)
add(music, pad(CH['Am9'][0] + [69, 76], b2s(8), 3500, 0.02), 52, 0.7)
add(music, bass(45, b2s(4)), 52, 0.5)
for beat in (52, 53, 54, 55):
    K(beat, 1.0 if beat == 52 else 0.8)
for beat in (53, 55):
    add(drums, clap(), beat, 0.45)
for k, (m, d) in enumerate([(81, 0), (84, 0.5), (88, 1), (86, 1.5), (84, 2.5), (81, 3)]):
    add(leads, bell(m, 3.0), 53 + d, 0.22, -0.3 + k * 0.12)

# ---------- зведення ----------
t_all = np.arange(N) / SR
duck = np.ones(N)
for tk in kicks:
    m = t_all >= tk
    duck[m] = np.minimum(duck[m], 1 - 0.55 * np.exp(-(t_all[m] - tk) / 0.11))
music *= duck[:, None]

# реверб: два хвости з експоненційного шуму
ir_t = tt(2.2)
ir = np.stack([rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.6) for _ in range(2)], axis=1)
ir[:, 0], ir[:, 1] = filt(ir[:, 0], 'low', 6000), filt(ir[:, 1], 'low', 6000)
ir /= np.abs(ir).sum(axis=0) ** 0.5 * 4


def verb(x, amt):
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], axis=1)
    return x + wet * amt


mix = drums + verb(music, 0.25) + verb(leads, 0.6) + verb(fx, 0.35)

# згасання наприкінці
fade = np.ones(N)
nf = int(1.6 * SR)
fade[-nf:] = np.linspace(1, 0, nf) ** 1.5
mix *= fade[:, None]

mix = filt(mix.T, 'high', 30).T
mix = np.tanh(mix / np.abs(mix).max() * 1.4)
mix = mix / np.abs(mix).max() * 0.89
wavfile.write('public/music.wav', SR, (mix * 32767).astype(np.int16))
print('ok', mix.shape)
