"""카톡 공유용: 장수별 미리보기 카드 이미지(1200x630)와 공유 페이지(r/영문이름.html) 만들기
사용: python -I tools/make_share.py https://내도메인/   (끝에 / 포함)
- 카톡은 링크의 og 태그(제목·설명·이미지)를 읽어 카드를 만든다. 이미지 주소는 반드시 전체 주소여야 함.
- r/jojo.html: 내 결과 공유용,  r/jojo-team.html: 동료·상사 결과 공유용(실명 없이 '우리 팀')
- 페이지를 열면 바로 앱(../?r=조조)으로 넘어감
"""
import sys, os, json, html
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = sys.argv[1] if len(sys.argv) > 1 else 'https://example.com/'
if not SITE.endswith('/'): SITE += '/'
SLUG = {'조조':'jojo','손권':'songwon','동탁':'dongtak','조비':'jobi','유비':'yubi','사마의':'samaui','순욱':'sunuk','초선':'choseon',
 '양수':'yangsu','십상시':'sipsangsi','제갈량':'jegallyang','주유':'juyu','방통':'bangtong','육손':'yukson','관우':'gwanu','조운':'jowun',
 '하후돈':'hahudon','전위':'jeonwi','장비':'jangbi','마초':'macho','여포':'yeopo','맹획':'maenghoek','황충':'hwangchung','화타':'hwata',
 '강유':'gangyu','위연':'wiyeon','황건적':'hwanggeonjeok','원술':'wonsul','원소':'wonso','마속':'masok'}
FONT = os.environ.get('SAMGUK_FONT', '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc')
FONT_B = os.environ.get('SAMGUK_FONT_BLACK', '/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc')
if not os.path.exists(FONT_B): FONT_B = FONT
PAPER, INK, SEAL, GOLD, LACQ = (244, 233, 207), (42, 26, 16), (179, 53, 43), (226, 187, 92), (30, 17, 10)

def load_data():
    js = open(os.path.join(ROOT, 'js', 'data.js'), encoding='utf-8').read()
    return json.loads(js[js.index('{'):js.rindex('}') + 1])

def josa(word, a, b):  # 받침 있으면 a(이), 없으면 b(가)
    ch = word[-1]; code = ord(ch) - 0xAC00
    return a if 0 <= code < 11172 and code % 28 else b

def wrap(d, text, font, maxw):  # 띄어쓰기 단위로 줄바꿈
    lines, cur = [], ''
    for w in text.split(' '):
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=font) > maxw and cur: lines.append(cur); cur = w
        else: cur = t
    lines.append(cur); return lines

def card(c, team=False):
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    # 단청 띠
    cols = [(31, 111, 92), (226, 187, 92), (194, 59, 44), (226, 187, 92), (47, 79, 143), (226, 187, 92)]
    widths = [32, 6, 16, 6, 28, 6]; x = 0
    while x < W:
        for col, w in zip(cols, widths): d.rectangle([x, 0, x + w, 22], fill=col); x += w
    d.rectangle([0, 22, W, 26], fill=SEAL)
    # 오른쪽 밝은 원(무대)
    glow = Image.new('L', (W, H), 0); ImageDraw.Draw(glow).ellipse([60, 120, 560, 640], fill=120)
    im.paste(Image.new('RGB', (W, H), (255, 248, 230)), (0, 0), glow.filter(ImageFilter.GaussianBlur(60)))
    # 캐릭터
    ch = Image.open(os.path.join(ROOT, 'img', c['name'] + '.webp')).convert('RGBA')
    ch.thumbnail((470, 560)); im.paste(ch, (310 - ch.width // 2, H - ch.height - 8), ch)
    # 오른쪽 글자
    f_small = ImageFont.truetype(FONT, 34); f_name = ImageFont.truetype(FONT_B, 118); f_sub = ImageFont.truetype(FONT, 38)
    f_q = ImageFont.truetype(FONT, 34); f_brand = ImageFont.truetype(FONT_B, 30)
    x0 = 610
    d.text((x0, 70), '직장 삼국지 · ' + c['type'], font=f_brand, fill=SEAL)
    d.text((x0, 128), '우리 팀의 그 분은' if team else '회사에서 나는', font=f_small, fill=(107, 82, 56))
    # 명패
    nb = d.textbbox((0, 0), c['name'], font=f_name); nw = nb[2] - nb[0]
    d.rounded_rectangle([x0 - 6, 178, x0 + nw + 50, 330], radius=8, fill=LACQ, outline=GOLD, width=5)
    d.rounded_rectangle([x0 + 4, 188, x0 + nw + 40, 320], radius=5, outline=(170, 135, 60), width=2)
    d.text((x0 + 22, 176), c['name'], font=f_name, fill=GOLD)
    # 세부유형 인장
    sb = d.textbbox((0, 0), c['sub'], font=f_sub); sw = sb[2] - sb[0]
    d.rectangle([x0 - 6, 350, x0 + sw + 26, 410], fill=SEAL); d.text((x0 + 10, 354), c['sub'], font=f_sub, fill=(255, 244, 220))
    # 대표 한마디 말풍선
    lines = wrap(d, '“' + c['quote'] + '”', f_q, 520)
    if len(lines) > 2: f_q = ImageFont.truetype(FONT, 30); lines = wrap(d, '“' + c['quote'] + '”', f_q, 530)
    lines = lines[:3]
    bh = 30 + 46 * len(lines)
    d.rounded_rectangle([x0 - 6, 440, x0 + 556, 440 + bh], radius=22, fill='white', outline=INK, width=4)
    for i, l in enumerate(lines): d.text((x0 + 18, 452 + i * 46), l, font=f_q, fill=INK)
    return im.convert('RGB')

PAGE = '''<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url={app}">
<script>location.replace({app_js});</script>
</head><body><a href="{app}">직장 삼국지로 이동</a></body></html>
'''

if __name__ == '__main__':
    D = load_data()
    for c in D['chars']:
        slug = SLUG[c['name']]
        for team in (False, True):
            fn = slug + ('-team' if team else '') + '.jpg'
            card(c, team).save(os.path.join(ROOT, 'img', 'share', fn), 'JPEG', quality=86, optimize=True)
            image = SITE + 'img/share/' + fn
            app = '../?r=' + c['name'] + ('&p=1' if team else '')
            title = (f"우리 팀에 {c['name']}({c['sub']}){josa(c['sub'], '이', '가')} 있다" if team else f"회사에서 나는 {c['name']}, {c['sub']}")
            desc = '“' + c['quote'] + '” · 우리 조직에서 나는 조조일까, 여포일까? 16문항으로 알아보는 직장 삼국지'
            name = slug + ('-team' if team else '') + '.html'
            open(os.path.join(ROOT, 'r', name), 'w', encoding='utf-8').write(PAGE.format(
                title=html.escape(title), desc=html.escape(desc), image=image, url=SITE + 'r/' + name,
                app=html.escape(app), app_js=json.dumps(app, ensure_ascii=False)))
    idx = os.path.join(ROOT, 'index.html'); h = open(idx, encoding='utf-8').read()
    import re
    h = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{SITE}img/og.png">', h)
    if 'og:url' not in h: h = h.replace('<meta property="og:image"', f'<meta property="og:url" content="{SITE}">\n<meta property="og:image"', 1)
    else: h = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{SITE}">', h)
    open(idx, 'w', encoding='utf-8').write(h)
    print('카드 60장, 공유 페이지 60개 생성 →', SITE)
