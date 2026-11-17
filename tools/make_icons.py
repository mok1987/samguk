# 앱 아이콘(192/512)과 공유 미리보기 이미지(og.png) 만들기
import sys
from PIL import Image, ImageDraw, ImageFont
font = sys.argv[1]
PAPER, SEAL, INK = (244, 236, 220), (179, 53, 43), (42, 32, 24)
def icon(size):
    im = Image.new('RGB', (size, size), PAPER); d = ImageDraw.Draw(im)
    m = size * .08; d.rounded_rectangle([m, m, size - m, size - m], radius=size * .14, fill=SEAL)
    f = ImageFont.truetype(font, int(size * .46)); d.text((size / 2, size / 2), '三', font=f, fill='white', anchor='mm')
    return im
icon(192).save('img/icon-192.png'); icon(512).save('img/icon-512.png')
og = Image.new('RGB', (1200, 630), PAPER); d = ImageDraw.Draw(og)
names = ['조조', '유비', '손권', '관우', '제갈량', '여포']
for i, n in enumerate(names):
    ch = Image.open(f'img/{n}.webp').convert('RGBA'); ch.thumbnail((230, 300))
    og.paste(ch, (int(20 + i * 195 + (195 - ch.width) / 2), 630 - ch.height - 10), ch)
f1 = ImageFont.truetype(font, 92); f2 = ImageFont.truetype(font, 38)
d.text((600, 120), '직장 삼국지', font=f1, fill=INK, anchor='mm')
d.text((600, 215), '회사에서 나는 어떤 장수일까?', font=f2, fill=SEAL, anchor='mm')
og.save('img/og.png')
print('ok')
