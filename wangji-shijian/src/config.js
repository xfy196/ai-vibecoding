// config.js: project settings.
//   忘记时间 (胡歌) · 手绘水彩 MV
//   130.8 BPM detected; half-time pulse 65.4 so idles/bounces stay ballad-slow.
//   First downbeat measured at 33.055 s; offset puts the half-time grid on the sung beat.
//   lyricOffset: 字幕整体微调（秒），正数 = 歌词往后推。核对成片后如果整片统一偏早/偏晚才动它；
//   逐行对不上不要用它补，那是 karaoke.js 里逐字填充时长的问题。tools/check_sync.py 可做客观校验。
const PROJECT = { duration: 272.14, bpm: 65.4, offset: 0.486, lyricOffset: 0, audio: 'assets/song.mp3' };
