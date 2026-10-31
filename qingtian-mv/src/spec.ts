// spec.ts — the film's contract. Every number, colour, font and copy line the prompt states lives here, once,
// tagged with its ledger id (S01, S02, ...). Scenes read from here; they never hard-code a value the prompt gave.
import {loadFont} from '@remotion/google-fonts/Inter';

// S17 one family, plain sans, used for the closing line and the nine tiny numbers
const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});

export const FILM = {duration: 60, fps: 30, width: 1920, height: 1080, bpm: 60, sound: true}; // S01 S02 S03
export const SAFE = {x: 150, y: 90}; // S18 nothing at rest inside the margins
export const FONT = fontFamily; // S17

// S04–S08 the palette: yellow-green, high saturation, low contrast, nothing pure black, one cool break.
export const COLOR = {
  springBg: '#F0DFA6', // S04 浅暖黄
  springWash: '#FBF2D2', // S04 the overexposed band on the wall
  springLine: '#6E6A46', // S04 the uniform is a line, not a shape
  ink: '#44452F', // S01 silhouettes: lifted black, olive
  inkDeep: '#3A3B2A',
  ivory: '#F8EFD6', // the button, always
  summerBg: '#B2BE2A', // S05 饱和黄绿
  summerDeep: '#93A01F',
  summerWash: '#D8DE72',
  paper: '#F9F2DA', // envelopes, letter sheets
  autumnSky: '#E9EBC7', // S06 upper layer
  autumnCrown: '#7F8D36',
  autumnCrownDeep: '#6C7A2C',
  autumnCloud: '#FBF8E6',
  autumnGround: '#C6CF85',
  autumnGrass: '#9FA84F',
  flower: '#E6C33C', // S06 小黄花
  winterBg: '#2B3641', // S07 深蓝灰
  winterGround: '#222B34',
  winterBlock: '#34414C',
  winterLine: '#C4CFCE', // S07 cello outline, not white: nothing pure
  bolt: '#F7FBF7', // S07 白色闪电
  beachBg: '#F5E7BE', // S08 回暖黄但更淡
  beachSea: '#D4DBB4',
  beachSand: '#CDB47F',
  beachPaper: '#FDF9EA',
};
export type Palette = typeof COLOR;

// S16 the closing line only; S17 lettering set straight but sitting unevenly, never handwritten
export const COPY = {line: 'JAY I LOVE U'};
export const TYPE = {size: 112, weight: 600, tracking: '0.01em'}; // S17

// S09–S16 the beat sheet, absolute seconds.
export const T = {
  handIn: 2.6, // S09 the hand comes in from the right
  grip: 4.3, // S09 it closes on the button
  buttonOut: 6.3, // S09 the button's arc takes 2 s and ends off frame
  trainIn: 4.0, // S10 the train leaves to the left over 4 s, at the same time
  trainOut: 8.0,
  springClear: 11.1,
  summerIn: 12.0,
  bentoIn: 12.2,
  lettersIn: 13.1,
  lift0: 14.0, // S11 nine lifts, 1.2 s apart
  liftStep: 1.2,
  liftCount: 9,
  summerOut: 26.2,
  autumnIn: 28.0,
  flower0: 28.3, // S12 the flower rises from below the frame, very slowly
  flower1: 42.0,
  winterIn: 42.0, // S07 the cut
  bolt0: 42.0, // S13 three frames
  bowAmp: 1.6, // S14 degrees, small
  winterOut: 52.0,
  beachIn: 52.0,
  sheet0: 52.9, // S16 nine sheets unfold
  sheetStep: 0.3,
  oMorph: 55.6, // X05 the button becomes the O
  fade0: 57.0, // S16 the last three seconds
  end: 60.0,
};
