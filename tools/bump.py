# 배포 전에 실행: index.html의 css/js 주소 뒤 ?v=번호를 지금 시각으로 바꿔서 휴대폰이 예전 파일을 쓰지 않게 함
# 사용: python -I tools/bump.py
import os, re, time
p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'index.html')
v = time.strftime('%Y%m%d%H%M')
h = open(p, encoding='utf-8').read()
h = re.sub(r'(href="css/style\.css|src="js/(?:data|engine|app)\.js)(\?v=\d+)?"', lambda m: m.group(1) + '?v=' + v + '"', h)
open(p, 'w', encoding='utf-8').write(h); print('version', v)
