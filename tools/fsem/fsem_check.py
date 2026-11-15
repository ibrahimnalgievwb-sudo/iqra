#!/usr/bin/env python3
"""Сверка реестра источников с Федеральным списком экстремистских материалов (ФСЭМ).

Использование:
  1) Скачайте актуальную выгрузку со страницы https://minjust.gov.ru/ru/extremist-materials/
     (кнопка «Скачать в формате .csv»), сохраните как exportfsm.csv.
  2) python3 fsem_check.py --csv exportfsm.csv --sources sources.json

Скрипт только ИЩЕТ совпадения. Он не заменяет проверку человеком: записи ФСЭМ привязаны к
конкретному изданию, поэтому каждое найденное совпадение нужно сверить вручную. Отсутствие
совпадения не является юридическим заключением, это лишь «не найдено в выгрузке на дату файла»."""
import argparse, csv, io, json, re, sys, datetime

def norm(s):
    s = s.lower().replace('ё', 'е').replace('’', "'").replace('‘', "'").replace('ʿ', "'").replace('‘', "'")
    s = re.sub(r'[«»"“”„()\[\]{}.,;:!?\\/|]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def load_records(path):
    data = open(path, 'rb').read()
    try:
        raw = data.decode('utf-8-sig')
    except UnicodeDecodeError:
        raw = data.decode('cp1251')  # так отдаёт файл сайт Минюста
    try:
        dialect = csv.Sniffer().sniff(raw[:4000], delimiters=';,\t|')
    except csv.Error:
        dialect = csv.excel
    out = []
    for row in csv.reader(io.StringIO(raw), dialect):
        if not row: continue
        text = ' '.join(c for c in row if c)
        num = next((c.strip() for c in row if re.fullmatch(r'\s*\d{1,5}\s*', c or '')), '')
        out.append((num, text))
    if len(out) < 3:  # запасной вариант: построчно
        out = [((re.match(r'\s*(\d{1,5})\b', l) or [None, ''])[1], l) for l in raw.splitlines() if l.strip()]
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--csv', required=True); ap.add_argument('--sources', default='sources.json')
    a = ap.parse_args()
    recs = [(n, t, norm(t)) for n, t in load_records(a.csv)]
    reg = json.load(open(a.sources, encoding='utf-8'))
    print(f'Записей в выгрузке: {len(recs)} | дата проверки: {datetime.date.today()}\n')
    worst = 0
    unknown = []
    for src in reg['sources']:
        hits = []
        for n, t, nt in recs:
            for grp in src.get('match', []):
                if grp and all(norm(w) in nt for w in grp):
                    hits.append((n, t)); break
        status = src['legal_status']
        if hits: flag = 'НАЙДЕНО В ФСЭМ — сверить издание вручную'
        elif src.get('legal_status') == 'not_applicable': flag = 'не применимо (это не издание книги)'
        elif src.get('match'): flag = 'не найдено в выгрузке на дату файла'
        else: flag = 'ПРОВЕРКА НЕВОЗМОЖНА (нет данных об издании)'
        if hits and src.get('used_in_app'): worst = 1
        if not src.get('match') and src.get('used_in_app') and src.get('legal_status') != 'not_applicable': unknown.append(src['id'])
        print(f"[{src['id']}] {src['title'][:60]}\n   в приложении: {'ДА' if src.get('used_in_app') else 'нет'} | заявленный статус: {status}\n   результат: {flag}")
        for n, t in hits[:5]: print(f"     № {n or '?'}: {t[:150]}")
        print()
    if unknown: print('ВНИМАНИЕ: не установлено издание у источников, которые используются в приложении:', ', '.join(unknown))
    sys.exit(worst)

if __name__ == '__main__': main()