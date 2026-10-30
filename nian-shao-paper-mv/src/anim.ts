import { spring } from 'remotion';
import { BEAT, FPS } from './theme';

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Linear ramp in frames, clamped both ends. */
export const ramp = (frame: number, from: number, to: number, a = 0, b = 1) =>
  to === from ? (frame >= to ? b : a) : lerp(a, b, clamp((frame - from) / (to - from)));

/** Same, but the window is given in seconds. */
export const rampS = (frame: number, fromSec: number, toSec: number, a = 0, b = 1) =>
  ramp(frame, fromSec * FPS, toSec * FPS, a, b);

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
export const easeIn = (t: number) => t * t * t;
export const easeOutBack = (t: number, s = 1.7) =>
  1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Eased ramp: the workhorse for layer slides. */
export const rampEased = (frame: number, from: number, to: number, a = 0, b = 1, ease = easeOut) =>
  lerp(a, b, ease(clamp((frame - from) / Math.max(1, to - from))));

/**
 * Percussive envelope: 1 exactly on the beat, decaying to 0 before the next.
 * This is the heartbeat of the film — every "per beat" motion uses it.
 */
export function pulse(frame: number, period = BEAT, sharp = 2.6): number {
  const m = ((frame % period) + period) % period;
  return Math.pow(1 - m / period, sharp);
}

/** Pulse that starts its grid at `startFrame` (shots that begin mid-bar). */
export function pulseFrom(frame: number, startFrame: number, period = BEAT, sharp = 2.6): number {
  return frame < startFrame ? 0 : pulse(frame - startFrame, period, sharp);
}

export const beatIndex = (frame: number, start = 0, period = BEAT) => Math.floor((frame - start) / period);

/** Paper layer sliding/flipping into place: soft, slightly overshooting spring. */
export function springIn(
  frame: number,
  start: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
): number {
  return spring({
    frame: frame - start,
    fps: FPS,
    config: { damping: 14, stiffness: 110, mass: 0.9, ...config },
  });
}

/** Stagger: 0..1 progress for item i of n across a window starting at `start`. */
export const stagger = (frame: number, start: number, dur: number, i: number, gap: number) =>
  easeOut(clamp((frame - start - i * gap) / dur));

/** Deterministic wobble for hand-cut breathing motion. */
export const wobble = (frame: number, seed = 1, speed = 0.05, amp = 1) =>
  Math.sin((frame * speed + seed * 1.7) * Math.PI * 2) * amp;

/** Small deterministic PRNG (mulberry32) — used to cut shapes the same way every frame. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1-D value noise in [-1,1] for organic, non-repeating drift. */
export function noise1(seed: number, t: number): number {
  const i = Math.floor(t);
  const fr = t - i;
  const h = (n: number) => {
    const s = Math.sin((n + seed * 57.13) * 127.1) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  return lerp(h(i), h(i + 1), smoothstep(fr));
}

/** 1 -> 0 over `frames`, or 0 outside. */
export const oneShot = (frame: number, at: number, frames: number) =>
  frame < at || frame > at + frames ? 0 : 1 - (frame - at) / frames;

/** Camera shake envelope. */
export const shake = (frame: number, at: number, frames: number, amp: number) => {
  const k = oneShot(frame, at, frames);
  return { x: Math.sin(frame * 2.3) * amp * k, y: Math.cos(frame * 3.1) * amp * 0.6 * k };
};
