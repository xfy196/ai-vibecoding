import { interpolate, spring } from 'remotion';
import { BEAT, FPS } from './theme';

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Linear ramp with clamping, expressed in frames. */
export const ramp = (frame: number, from: number, to: number, a = 0, b = 1) =>
  interpolate(frame, [from, to], [a, b], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;

/**
 * Percussive envelope: 1 exactly on the beat, decaying to 0 before the next one.
 * This is the heartbeat of the whole film — every "per beat" motion uses it.
 */
export function pulse(frame: number, period = BEAT, sharp = 2.6): number {
  const m = ((frame % period) + period) % period;
  return Math.pow(1 - m / period, sharp);
}

/** Same, but silent until `start` (shots that begin mid-bar). */
export function pulseFrom(frame: number, start: number, period = BEAT, sharp = 2.6): number {
  return frame < start ? 0 : pulse(frame - start, period, sharp);
}

/** Frame index of the beat that just happened, relative to `start`. */
export const beatIndex = (frame: number, start = 0, period = BEAT) => Math.floor((frame - start) / period);

/** Paper layer sliding/flipping into place: a soft, slightly overshooting spring. */
export function springIn(
  frame: number,
  start: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
): number {
  return spring({
    frame: frame - start,
    fps: FPS,
    config: { damping: 14, stiffness: 110, mass: 0.9, ...config },
    durationInFrames: undefined,
  });
}

/** Stagger helper: returns 0..1 progress for item i of n across a window. */
export const stagger = (frame: number, start: number, dur: number, i: number, gap: number) =>
  easeOut(ramp(frame, start + i * gap, start + i * gap + dur));

/** Deterministic wobble used for hand-cut breathing motion. */
export const wobble = (frame: number, seed = 1, speed = 0.05, amp = 1) =>
  Math.sin((frame * speed + seed * 1.7) * Math.PI * 2) * amp;
