import numpy as np

cuts = [0, 3.6, 5.7, 7.4, 10.4, 13.8, 17.3, 20.2, 22.4, 24.1]

def cost(T, phase, cuts):
    tot = 0.0
    errs = []
    for c in cuts:
        k = round((c - phase) / T)
        e = (c - phase) - k * T
        errs.append(e)
        tot += e * e
    return tot, errs

best = None
for T in np.arange(0.30, 1.201, 0.0005):
    for phase in np.arange(0, T, T / 40):
        c, errs = cost(T, phase, cuts)
        if best is None or c < best[0]:
            best = (c, T, phase, errs)

c, T, phase, errs = best
print('best T=%.4f (%.1f BPM) phase=%.4f rms_err=%.4f max_err=%.4f' % (T, 60 / T, phase, (c / len(cuts)) ** 0.5, max(abs(e) for e in errs)))
for cut, e in zip(cuts, errs):
    print('  cut %5.2f  err %+0.4f  beats %.2f' % (cut, e, (cut - phase) / T))

# constrain T to 0.6 (100bpm) as shot1 implies 6 beats in 3.6s
for T in (0.6, 0.425, 0.7, 0.58, 0.5833, 0.577):
    c, errs = cost(T, 0.0, cuts)
    print('T=%.4f (%.1f bpm) rms=%.4f errs=%s' % (T, 60/T, (c/len(cuts))**0.5, [round(e,3) for e in errs]))
