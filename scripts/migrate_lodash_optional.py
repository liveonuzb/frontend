#!/usr/bin/env python3
import os
import glob
import re

COACH_DIR = "/Users/shoxruxshomurodov/Desktop/liveon/web-app/src/modules/coach"

def update_imports(content, add_funcs):
    if not add_funcs: return content
    match = re.search(r'import\s+\{([^}]+)\}\s+from\s+["\']lodash["\'];', content)
    if not match: return content
    
    existing = [f.strip() for f in match.group(1).split(',')]
    existing = [f for f in existing if f]
    needed = set(existing) | set(add_funcs)
    new_imports = sorted(list(needed))
    
    if len(new_imports) <= 4:
        new_import_str = f'import {{ {", ".join(new_imports)} }} from "lodash";'
    else:
        funcs_str = ",\n  ".join(new_imports)
        new_import_str = f'import {{\n  {funcs_str},\n}} from "lodash";'
        
    return content[:match.start()] + new_import_str + content[match.end():]

def process_optional_chaining(content):
    new_content = content
    funcs_to_add = set()

    # Pass 1: Simple word?.word  => get(word, "word")
    # Using negative lookbehind to ensure we aren't halfway through an object
    # Actually if it's obj.user?.avatar, it should be obj.user?.avatar -> get(obj.user, "avatar")
    # Let's match a sequence of words separated by dots as the object
    # pattern: obj?.prop
    pattern1 = r'(?<![a-zA-Z0-9_$])([a-zA-Z_$][a-zA-Z0-9_$.]*)\?\.([a-zA-Z_$][a-zA-Z0-9_$]*)(?!\()'
    for _ in range(10):
        match = re.search(pattern1, new_content)
        if not match: break
        rep = f'get({match.group(1)}, "{match.group(2)}")'
        new_content = new_content[:match.start()] + rep + new_content[match.end():]
        funcs_to_add.add('get')

    # Pass 2: get(..., "...")?.word => get(..., "....word")
    pattern2 = r'get\(([a-zA-Z_$][a-zA-Z0-9_$.]*),\s*"([a-zA-Z0-9_$.]+)"\)\?\.([a-zA-Z_$][a-zA-Z0-9_$]*)(?!\()'
    for _ in range(10):
        match = re.search(pattern2, new_content)
        if not match: break
        obj = match.group(1)
        path = match.group(2)
        prop = match.group(3)
        rep = f'get({obj}, "{path}.{prop}")'
        new_content = new_content[:match.start()] + rep + new_content[match.end():]
        funcs_to_add.add('get')

    # Pass 3: [0] or similar static indexing via ?.
    # obj?.[0] => get(obj, "[0]")
    pattern3 = r'(?<![a-zA-Z0-9_$])([a-zA-Z_$][a-zA-Z0-9_$.]*)\?\.(?:\[(\d+)\])'
    for _ in range(10):
        match = re.search(pattern3, new_content)
        if not match: break
        obj = match.group(1)
        idx = match.group(2)
        rep = f'get({obj}, "[{idx}]")'
        new_content = new_content[:match.start()] + rep + new_content[match.end():]
        funcs_to_add.add('get')

    # Pass 4: get(..., "...")?.[0] => get(..., "...[0]")
    pattern4 = r'get\(([a-zA-Z_$][a-zA-Z0-9_$.]*),\s*"([a-zA-Z0-9_$.]+)"\)\?\.(?:\[(\d+)\])'
    for _ in range(10):
        match = re.search(pattern4, new_content)
        if not match: break
        obj = match.group(1)
        path = match.group(2)
        idx = match.group(3)
        rep = f'get({obj}, "{path}[{idx}]")'
        new_content = new_content[:match.start()] + rep + new_content[match.end():]
        funcs_to_add.add('get')
        
    return new_content, funcs_to_add

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content, add_funcs = process_optional_chaining(content)

    if add_funcs:
        new_content = update_imports(new_content, add_funcs)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Changed ?.: {os.path.basename(filepath)}")
        return True
    return False

def main():
    files = []
    for ext in ['*.jsx', '*.js']:
        files.extend(glob.glob(os.path.join(COACH_DIR, '**', ext), recursive=True))

    files.sort()
    changed = 0

    for filepath in files:
        if process_file(filepath):
            changed += 1

    print(f"\nChanged {changed} files.")

if __name__ == '__main__':
    main()
