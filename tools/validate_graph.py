#!/usr/bin/env python3
"""Проверка графа знаний «Умной книги» (Addendum v2.2).
Правила: у каждой связи есть evidence_source (источник из реестра + место в нём); источник не заблокирован;
тафсир берётся только из источников со статусом 'cleared'; конечные точки существуют;
статус 'verified' требует verified_by и verified_at и источника со статусом 'cleared'."""
import json, os, sys
ROOT = os.environ.get('IQRA_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load(path, key, default):
    f = os.path.join(ROOT, path)
    return json.load(open(f, encoding='utf-8')).get(key, default) if os.path.exists(f) else default

sources = {s['id']: s for s in load('tools/fsem/sources.json', 'sources', [])}
quran = {i['id']: i for i in load('data/quran.json', 'quran', [])}
ids = {
    'hadith': {i['id'] for i in load('data/hadiths.json', 'hadiths', [])},
    'dua': {i['id'] for i in load('data/duas.json', 'duas', [])},
    'tasbih': {i['id'] for i in load('data/tasbihs.json', 'defaults', [])},
    'theme': {t['id'] for t in load('data/graph/themes.json', 'themes', [])},
    'scholar': {s['id'] for s in load('data/graph/scholars.json', 'scholars', [])},
    'tafsir': {t['id'] for t in load('data/tafsirs.json', 'tafsirs', [])},
}
tafsirs = load('data/tafsirs.json', 'tafsirs', [])
edges = load('data/graph/edges.json', 'edges', [])
TYPES = {
    'tafsir_comments_ayah': ('tafsir', 'ayah'), 'hadith_explains_ayah': ('hadith', 'ayah'),
    'hadith_in_tafsir': ('hadith', 'tafsir'), 'dua_in_tafsir': ('dua', 'tafsir'),
    'tasbih_in_tafsir': ('tasbih', 'tafsir'), 'ayah_theme': ('ayah', 'theme'),
    'theme_theme': ('theme', 'theme'), 'ayah_related_ayah': ('ayah', 'ayah'), 'tafsir_author': ('tafsir', 'scholar'),
}
errors = []
def err(m): errors.append(m)

def split(ref):
    k, _, v = str(ref).partition(':')
    return k, v

def ref_exists(ref):
    kind, val = split(ref)
    if kind == 'ayah':
        qid, _, n = val.partition('#')
        q = quran.get(qid)
        if not q or not n.isdigit(): return False
        lines = [l for l in str(q.get('arabic', '')).split('\n') if l.strip()]
        return 1 <= int(n) <= max(1, len(lines))
    return val in ids.get(kind, set())

def check_evidence(owner, ev, need_cleared):
    if not isinstance(ev, dict): return err(f'{owner}: нет evidence_source')
    sid, loc = ev.get('source_id'), str(ev.get('locator', '')).strip()
    if sid not in sources: return err(f'{owner}: источник «{sid}» отсутствует в реестре')
    if not loc: err(f'{owner}: не указано место в источнике (locator: том/страница/номер)')
    st = sources[sid].get('legal_status')
    if st == 'blocked': err(f'{owner}: источник «{sid}» заблокирован (ФСЭМ)')
    elif need_cleared and st != 'cleared': err(f'{owner}: источник «{sid}» не прошёл проверку ФСЭМ (статус: {st})')

seen = set()
for t in tafsirs:
    o = f"тафсир {t.get('id')}"
    check_evidence(o, t.get('evidence_source'), True)
    if not str(t.get('text_ru', '')).strip(): err(f'{o}: пустой текст')
    if not ref_exists(f"ayah:{t.get('ayah_ref','')}"): err(f"{o}: аят «{t.get('ayah_ref')}» не найден")
    if t.get('ayah_ref_end') and not ref_exists(f"ayah:{t['ayah_ref_end']}"): err(f"{o}: конец диапазона «{t['ayah_ref_end']}» не найден")
    if t.get('scholar_id') not in ids['scholar']: err(f"{o}: учёный «{t.get('scholar_id')}» не найден")

for e in edges:
    o = f"связь {e.get('id')}"
    if e.get('id') in seen: err(f'{o}: повтор id')
    seen.add(e.get('id'))
    if e.get('type') not in TYPES: err(f"{o}: неизвестный тип «{e.get('type')}»"); continue
    kf, kt = TYPES[e['type']]
    for side, kind in (('from', kf), ('to', kt)):
        k, _ = split(e.get(side, ''))
        if k != kind: err(f"{o}: «{side}» должен быть типа {kind}")
        elif not ref_exists(e.get(side)): err(f"{o}: «{e.get(side)}» не найден")
    verified = e.get('status') == 'verified'
    check_evidence(o, e.get('evidence_source'), verified)
    if verified and not (e.get('verified_by') and e.get('verified_at')): err(f'{o}: статус verified требует verified_by и verified_at')
    if e.get('status') not in ('draft', 'verified'): err(f"{o}: статус должен быть draft или verified")

print(f'Граф знаний: связей {len(edges)}, тафсиров {len(tafsirs)}, ошибок {len(errors)}')
for m in errors: print('  ОШИБКА:', m)
sys.exit(1 if errors else 0)