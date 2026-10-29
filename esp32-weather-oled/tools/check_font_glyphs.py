"""检查 OLED 上会用到的字符是否都在 U8g2 的 wqy12 GB2312 字库里。

直接解析 U8g2 字体二进制格式（见 u8g2_font.c: u8g2_font_get_glyph_data）：
  23 字节头 + ASCII 段 + Unicode 查找表 + 字形数据
用法：python tools/check_font_glyphs.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONTS_C = ROOT / "firmware" / ".pio" / "libdeps" / "esp32dev" / "U8g2" / "src" / "clib" / "u8g2_fonts.c"
FONT_NAME = "u8g2_font_wqy12_t_gb2312"


def load_font(path: Path, name: str) -> bytes:
    """u8g2_fonts.c 里字体是 C 字符串字面量（八进制转义），不是 {0x..} 数组"""
    text = path.read_text(encoding="utf-8", errors="replace")
    m = re.search(r"const\s+uint8_t\s+" + re.escape(name) + r"\s*\[(\d+)\][^=]*=\s*", text)
    if not m:
        raise SystemExit("找不到字体：" + name)
    size = int(m.group(1))

    out = bytearray()
    i = m.end()
    while len(out) < size and i < len(text):
        if text[i] == '"':
            i += 1
            while i < len(text) and text[i] != '"':
                c = text[i]
                if c == "\\":
                    i += 1
                    n = text[i]
                    if n in "01234567":
                        digits = n
                        i += 1
                        while i < len(text) and len(digits) < 3 and text[i] in "01234567":
                            digits += text[i]
                            i += 1
                        out.append(int(digits, 8) & 0xFF)
                        continue
                    out.append({"n": 10, "r": 13, "t": 9, "a": 7, "b": 8,
                                "f": 12, "v": 11, "\\": 92, '"': 34, "'": 39,
                                "?": 63}.get(n, ord(n)) & 0xFF)
                    i += 1
                else:
                    out.append(ord(c) & 0xFF)
                    i += 1
            i += 1
            continue
        i += 1

    if len(out) < size:
        raise SystemExit(f"字体数据不完整：{len(out)} < {size}")
    return bytes(out[:size])


class Font:
    def __init__(self, data: bytes):
        self.d = data
        self.cnt = data[0]
        self.start_upper_A = (data[17] << 8) | data[18]
        self.start_lower_a = (data[19] << 8) | data[20]
        self.start_unicode = (data[21] << 8) | data[22]

    def has(self, cp: int) -> bool:
        d = self.d
        if cp <= 255:
            font = 23
            if cp >= ord("a"):
                font += self.start_lower_a
            elif cp >= ord("A"):
                font += self.start_upper_A
            for _ in range(4096):
                if font + 1 >= len(d) or d[font + 1] == 0:
                    return False
                if d[font] == cp:
                    return True
                font += d[font + 1]
            return False

        base = 23 + self.start_unicode
        lut = base
        pos = 0
        found = False
        for _ in range(8192):
            if lut + 3 >= len(d):
                return False
            off = (d[lut] << 8) | d[lut + 1]
            enc = (d[lut + 2] << 8) | d[lut + 3]
            lut += 4
            # 查找表里存的是「相对上一块」的增量，要累加（见 u8g2_font.c）
            pos += off
            if enc >= cp:
                found = True
                break
        if not found:
            return False

        font = base + pos
        for _ in range(8192):
            if font + 2 >= len(d):
                return False
            e = (d[font] << 8) | d[font + 1]
            if e == 0:
                return False
            if e == cp:
                return True
            step = d[font + 2]
            if step == 0:
                return False
            font += step
        return False


def ui_strings() -> list[str]:
    """抓会画到 OLED 上的字符串。

    - ui.cpp / main.cpp / weather.cpp：所有中文字面量都是屏幕文字
    - provision.cpp：只取 uiBoot("...") 的参数，其余是配网页 HTML（浏览器渲染，和字库无关）
    """
    files = ["firmware/src/ui.cpp", "firmware/src/main.cpp", "firmware/src/weather.cpp"]
    out = []
    for rel in files:
        src = (ROOT / rel).read_text(encoding="utf-8")
        for lit in re.findall(r'"([^"\\]*)"', src):
            if any(ord(ch) > 127 for ch in lit):
                out.append(lit)

    prov = (ROOT / "firmware/src/provision.cpp").read_text(encoding="utf-8")
    for lit in re.findall(r'uiBoot\("([^"\\]*)"\s*,\s*"([^"\\]*)"\)', prov):
        out.extend(part for part in lit if part)
    return sorted(set(out))


def main() -> int:
    if not FONTS_C.exists():
        raise SystemExit(f"先编译一次，让 U8g2 下载到 {FONTS_C.parent}")
    font = Font(load_font(FONTS_C, FONT_NAME))
    print(f"{FONT_NAME}: glyph_cnt={font.cnt}  unicode_pos={font.start_unicode}")

    strings = ui_strings()
    print(f"屏幕文字 {len(strings)} 条，逐字检查……")

    missing = {}
    for s in strings:
        for ch in s:
            cp = ord(ch)
            if cp in (0x0A, 0x0D):
                continue
            if not font.has(cp):
                missing.setdefault(cp, []).append(s)
    if missing:
        print("\n字库里缺这些字符（屏幕会画不出来）：")
        for cp, where in sorted(missing.items()):
            print(f"  U+{cp:04X} {chr(cp)}  用在: {', '.join(where)}")
        return 1

    print("\n所有界面文字都在字库里 OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
