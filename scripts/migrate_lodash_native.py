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

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    funcs_to_add = set()

    # Generic method pattern, matched repeatedly
    methods = {
        'trim': 'trim',
        'split': 'split',
        'slice': 'slice',
        'toLowerCase': 'toLower',
        'toUpperCase': 'toUpper'
    }

    for method, lodash_func in methods.items():
        pattern = r'(?<![a-zA-Z0-9_$])([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+|\[[^\]]+\]|(?:\([^()]*\)))*)\.' + method + r'\(([^)]*)\)'
        while True:
            match = re.search(pattern, new_content)
            if not match: break
            arg = match.group(2)
            func_call = f'{lodash_func}({match.group(1)}, {arg})' if arg else f'{lodash_func}({match.group(1)})'
            new_content = new_content[:match.start()] + func_call + new_content[match.end():]
            funcs_to_add.add(lodash_func)

    # Re-apply any simple [0] access for strings on split, like: 
    # map(name.split(" "), (w) => w[0]) -> map(split(name, " "), (w) => get(w, "[0]"))
    # (Simplified: we'll leave [0] for arrays if it requires context, but we fixed it earlier).

    if funcs_to_add:
        new_content = update_imports(new_content, funcs_to_add)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Changed {os.path.basename(filepath)}: added {funcs_to_add}")
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
