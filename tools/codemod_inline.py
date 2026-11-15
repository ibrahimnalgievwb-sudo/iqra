#!/usr/bin/env python3
"""Кодмод: заменяет inline-обработчики (onclick/oninput/onchange) на data-click/data-input/data-change
(см. js/actions.js). Безопасен: обрабатывает ТОЛЬКО известные формы; на всё незнакомое останавливается
с ошибкой, ничего не угадывая. Использование: codemod_inline.py in.html out.html [pairs.json]"""
import html, json, re, sys

def split_top(s, sep):
    out, cur, depth, q, i = [], '', 0, None, 0
    while i < len(s):
        c = s[i]
        if q:
            cur += c
            if c == '\\' and i + 1 < len(s): cur += s[i + 1]; i += 1
            elif c == q: q = None
        elif c in '\'"': q = c; cur += c
        elif c in '([{': depth += 1; cur += c
        elif c in ')]}': depth -= 1; cur += c
        elif c == sep and depth == 0: out.append(cur); cur = ''
        else: cur += c
        i += 1
    if cur.strip(): out.append(cur)
    return [x.strip() for x in out if x.strip()]

def arg(a):
    a = a.strip()
    m = re.fullmatch(r"'((?:[^'\\]|\\.)*)'", a)
    if m: return m.group(1).replace("\\'", "'")
    if re.fullmatch(r'-?\d+', a): return int(a)
    if re.fullmatch(r'-?\d+\.\d+', a): return float(a)
    if a in ('null', 'true', 'false'): return {'null': None, 'true': True, 'false': False}[a]
    special = {'event': 'event', 'this.value': 'value', 'this.checked': 'checked', 'this': 'el'}
    if a in special: return {'$': special[a]}
    raise ValueError('незнакомый аргумент: ' + a)

def stmt(st):
    st = st.strip().rstrip(';')
    if st == 'event.stopPropagation()': return ['@stop']
    if st == 'event.preventDefault()': return ['@prevent']
    m = re.fullmatch(r'if\s*\(\s*event\.target\s*===\s*this\s*\)\s*(.+)', st, re.S)
    if m: return ['@self'] + stmt(m.group(1))
    m = re.fullmatch(r"document\.getElementById\('([^']+)'\)\.click\(\)", st)
    if m: return [['@click', m.group(1)]]
    m = re.fullmatch(r"document\.getElementById\('([^']+)'\)\.classList\.remove\('([^']+)'\)", st)
    if m: return [['@removeClass', m.group(1), m.group(2)]]
    m = re.fullmatch(r'([A-Za-z_]\w*)\((.*)\)', st, re.S)
    if m:
        args = [arg(x) for x in split_top(m.group(2), ',')] if m.group(2).strip() else []
        return [[m.group(1)] + args]
    raise ValueError('незнакомая форма: ' + st)

def convert(body):
    steps = []
    for st in split_top(html.unescape(body), ';'): steps += stmt(st)
    return steps

def main(src, dst, pairs=None):
    h = open(src, encoding='utf-8', newline='').read()
    log = []
    def sub(m):
        ev, body = m.group(1), m.group(2)
        steps = convert(body)
        js = json.dumps(steps, ensure_ascii=False, separators=(',', ':'))
        log.append({'event': ev, 'original': html.unescape(body), 'attr': js})
        return " data-%s='%s'" % (ev, js.replace("'", '&#39;'))
    out = re.sub(r'\son(click|input|change)="([^"]*)"', sub, h)
    left = re.findall(r'\son[a-z]+="', out)
    open(dst, 'w', encoding='utf-8', newline='').write(out)
    if pairs: json.dump(log, open(pairs, 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'заменено обработчиков: {len(log)}; осталось inline: {len(left)}')

if __name__ == '__main__': main(*sys.argv[1:4])