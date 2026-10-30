import io
import sys

sys.stdout.reconfigure(encoding='utf-8')

# ---- shot script: lyrics are on screen now
p = 'docs/shot-script.md'
s = io.open(p, encoding='utf-8-sig').read()
s = s.replace(
    '| 字幕 | 歌词不上屏（MV 惯例）；仅片头片名/人员、片尾落款 |',
    '| 字幕 | **歌词上屏**：剪纸字形（楷/宋体，书宋纸白 `#f7f1e3`）压在一条 45% 墨色撕边纸影上，逐行取 .lrc 时间戳；片头片名/人员、片尾落款同样用剪纸字 |',
)
s = s.replace(
    '## 4. 逐镜头脚本',
    """### 3.1 歌词层（全片共用）

- **版式**：居中下三分之一，基线 968 px，字号随字数自适应（56 / 50 / 44 / 40 px），字距 5 px。
- **材质**：一条宽 = 字宽 + 120、高 104 px 的**撕边纸条**做底衬（墨色 42–62% 渐变，始终轻微摆动 ±0.2°）；
  字是"贴"在纸上的纸片——先一层 3 px 偏移的硬投影，再叠纸白字，字身不带描边。
- **进出**：进字 = 从下方 26 px 落下并弹回（spring），出字 = 上移 16 px 淡出；换行不叠字。
- **可读性**：只在有字的时间段压一层底部渐变纱（0 → 52% 黑，45% 处起坡），无字时完全不压画面。
- **时间轴**：直接读 `.lrc` 的 43 行时间戳（`src/theme.ts` 的 `LYRICS`），一行显示到下一行前 0.08 s。
- **声音**：每句上屏配一声 5% 音量的纸张轻响（`paper_swish`），共 43 处。

## 4. 逐镜头脚本""",
)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('shot script updated')

# ---- README
p = 'README.md'
s = io.open(p, encoding='utf-8-sig').read()
s = s.replace(
    '- 9 个镜头，9 种互不重复的构图',
    '- 9 个镜头，9 种互不重复的构图\n- 43 行歌词以剪纸字形逐行上屏（时间轴取自 .lrc）',
)
s = s.replace(
    '| ① | 0:00 | 窗阵隧道（一点透视向心推） |',
    '| ① | 0:00 | 窗阵隧道（一点透视向心推） |',
)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('README updated')
