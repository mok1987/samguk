# GPT로 만든 UI 이미지(버튼·두루마리) → 투명 배경 WebP
# 사용: python -I tools/prep_ui.py image img/ui
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
JOBS = [  # (원본 파일, 저장 이름, 가로 크기)
    ('전통 용문양 출정 버튼.png', 'btn-start', 960),
    ('삼국지풍 인간관계 유형 두루마리.png', 'scroll-lead', 960),
    ('고풍스러운 중국식 산수 두루마리-1.png', 'scroll-blank', 960),  # 글자 없는 두루마리(글자는 코드로 얹음)
    ('삼국풍 금장 장식 전쟁 깃발-2.png', 'banner', 960),              # 글자 없는 붉은 깃발(버튼 바탕)
]
for fname, out, width in JOBS:
    im = Image.open(os.path.join(src, fname)).convert('RGBA'); a = np.array(im)
    if a[:, :, 3].min() == 255:  # 흰 배경 → 가장자리와 이어진 밝고 색 없는 부분만 투명
        rgb = a[:, :, :3].astype(int)
        near = (rgb.min(2) > 200) & (rgb.max(2) - rgb.min(2) < 40)
        lab, n = ndimage.label(near)
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(edge))
        fl, fn = ndimage.label(~bg)  # 본체와 떨어진 조각(배경 구름, 다른 그림 일부) 제거
        sizes = ndimage.sum(np.ones_like(fl), fl, range(1, fn + 1))
        keep = [i + 1 for i, v in enumerate(sizes) if v > 0.05 * fl.size]
        a[:, :, 3] = np.where(np.isin(fl, keep), 255, 0).astype(np.uint8)
        a[:, :, 3] = np.array(Image.fromarray(a[:, :, 3]).filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(1)))
        im = Image.fromarray(a)
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 30 else 0).getbbox())
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(dst, out + '.webp'), 'WEBP', quality=88, method=6)
    print(out, im.size, os.path.getsize(os.path.join(dst, out + '.webp')) // 1024, 'KB')
