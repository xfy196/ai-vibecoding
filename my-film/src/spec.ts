// spec.ts — the film's contract. Every number, colour, font and copy line the prompt states lives here, once,
// tagged with its ledger id (S01, S02, ...). Scenes read from here; they never hard-code a value the prompt gave.
export const FILM = {duration: 15, fps: 30, width: 1920, height: 1080, bpm: 60, sound: true}; // S01 15 s · S02 loop · S04* 1920×1080 · S05* 30 fps · S03* 60 BPM
export const SAFE = {x: 150, y: 90};                                                          // S06*
// S07*: one serif with a Song cut — the family of printed Chinese; hairline serifs hold at 230 px.
export const FONT = '"Songti SC", "Noto Serif SC", "Source Han Serif SC", serif';
export const COLOR = {
  paper: '#F2EDE1',   // S08* rice paper, warm, never pure white
  ink: '#1E1C17',     // S09* the type, and the seal's knocked-out characters
  wash: '#2E3B32',    // S10* 青墨 — one ink, green-black; only its opacity changes
  seal: '#B0362C',    // S11* the single red in the film
};
export const COPY = {title: '青山'};                                                          // S12 the brand name, and the only word on screen
export const SEED: [number, number] = [1180, 292];   // S15* the dot the loop turns on: frame 0 and frame 450 are this dot
export const LAND: [number, number] = [1180, 700];   // S16* where it lands and the wash begins
export const TITLE = {x: 386, size: 232, yTop: 420, yBot: 690, sealY: 878, seal: 88};          // S13* S14* vertical block, left third, seal under it
// T block — every beat, absolute seconds at 60 BPM (one beat = 1 s).
export const T = {
  seed: 0, fall: 0.15, land: 1.0, soak: 1.7, far: 3.2,      // 落墨
  mid: 4.4, near: 5.3, crest: 6.4,                          // 成山
  lift: 7.0, leaf: 8.5, drift: 9.6, gather: 9.7,            // 一叶
  blob: 10.8, reveal: 11.5, thin: 12.3, print: 12.5,        // 题名
  out: 13.4, back: 14.15, seedBack: 14.9, end: 15,          // 归山
};
