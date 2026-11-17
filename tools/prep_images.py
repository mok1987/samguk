# 원본 PNG -> 웹용 투명 WebP(640px). 배경이 흰색인 이미지는 가장자리와 이어진 흰 영역만 투명 처리.
# 사용: python -I tools/prep_images.py image img   (D:\dev\company 폴더에서 실행)
import sys, os, glob, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
src, dst = sys.argv[1], sys.argv[2]
rename = {'봉추': '방통', '조자룡': '조운'}
os.makedirs(dst, exist_ok=True)
for f in sorted(glob.glob(os.path.join(src, '*.png'))):
    name = os.path.splitext(os.path.basename(f))[0]; name = rename.get(name, name)
    im = Image.open(f).convert('RGBA'); a = np.array(im)
    rgb = a[:, :, :3].astype(int); alpha = a[:, :, 3]
    if alpha.min() == 255:  # 투명 배경이 없는 이미지
        # 흰색·연회색(체크무늬 포함) 배경 중 가장자리와 이어진 부분
        near = (rgb.min(2) > 180) & (rgb.max(2) - rgb.min(2) < 16)
        lab, n = ndimage.label(near)
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(edge))
        bg = ndimage.binary_closing(bg, iterations=2)
        # 캐릭터 본체와 떨어진 작은 점(얼룩)은 배경으로
        fl, fn = ndimage.label(~bg)
        if fn:
            sizes = ndimage.sum(np.ones_like(fl), fl, range(1, fn + 1))
            keep = [i + 1 for i, v in enumerate(sizes) if v > 0.01 * fl.size]
            bg = ~np.isin(fl, keep)
        m = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
        mm = np.array(m); mm[:4, :] = 0; mm[-4:, :] = 0; mm[:, :4] = 0; mm[:, -4:] = 0  # 원본 테두리 선 제거
        a[:, :, 3] = mm; im = Image.fromarray(a)
    bb = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    im = im.crop(bb)
    w, h = im.size; s = 640 / max(w, h)
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    im.save(os.path.join(dst, name + '.webp'), 'WEBP', quality=86, method=6)
    print(name, im.size, os.path.getsize(os.path.join(dst, name + '.webp')) // 1024, 'KB')
