#!/usr/bin/env python3
"""
Migrate `import _ from "lodash"` + `_.func(...)` 
back to named imports: `import { get, map, ... } from "lodash"` + `func(...)`
"""

import re
import os
import glob

COACH_DIR = "/Users/shoxruxshomurodov/Desktop/liveon/web-app/src/modules/coach"

# All known lodash functions
ALL_LODASH_FUNCS = [
    "get", "map", "find", "filter", "includes", "size", "sumBy", "isEmpty", "isNil",
    "isArray", "keys", "values", "entries", "toLower", "trim", "split", "join", "toUpper",
    "forEach", "some", "keys", "reduce", "clamp", "orderBy", "round", "replace",
    "slice", "toNumber", "toString", "concat", "groupBy", "take", "times", "isEqual",
    "compact", "flatten", "uniq", "pick", "omit", "merge", "set", "has",
    "head", "tail", "last", "first", "debounce", "throttle", "chunk", "zip",
    "fromPairs", "toPairs", "sortBy", "every", "countBy", "flatMap", "keyBy",
    "mapValues", "mapKeys", "invert", "difference", "intersection", "union", "without",
    "min", "max", "sum", "mean", "cloneDeep", "clone", "isObject",
    "isString", "isNumber", "isBoolean", "isFunction", "isUndefined", "isNull",
    "identity", "noop", "range",
]

def find_used_lodash_funcs(content):
    """Find all _.funcName() usages in content and return set of function names."""
    used = set()
    for func in ALL_LODASH_FUNCS:
        pattern = r'(?<![.\w])_\.' + re.escape(func) + r'(?=\s*[\(\[])'
        if re.search(pattern, content):
            used.add(func)
    return used

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if there's a default lodash import
    default_import_pattern = r'import\s+_\s+from\s*["\']lodash["\'];?\n?'
    if not re.search(default_import_pattern, content):
        print(f"  SKIP (no default lodash import): {os.path.basename(filepath)}")
        return False

    print(f"  Processing: {os.path.basename(filepath)}")

    # Find all _.func() usages
    used_funcs = find_used_lodash_funcs(content)

    if not used_funcs:
        # No _.func() usages, just remove the import
        content = re.sub(default_import_pattern, '', content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"    No lodash usages found, removed import")
        return True

    # Sort functions alphabetically for clean import
    sorted_funcs = sorted(used_funcs)
    print(f"    Used functions: {sorted_funcs}")

    # Replace _.func(...) -> func(...)
    for func in sorted_funcs:
        pattern = r'(?<![.\w])_\.' + re.escape(func) + r'(?=\s*[\(\[])'
        content = re.sub(pattern, func, content)

    # Replace default import with named import
    if len(sorted_funcs) <= 4:
        named_import = f'import {{ {", ".join(sorted_funcs)} }} from "lodash";'
    else:
        # Multi-line for many imports
        funcs_str = ",\n  ".join(sorted_funcs)
        named_import = f'import {{\n  {funcs_str},\n}} from "lodash";'

    content = re.sub(default_import_pattern, named_import + '\n', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"    Done! → import {{ {', '.join(sorted_funcs[:3])}{'...' if len(sorted_funcs) > 3 else ''} }} from \"lodash\"")
    return True

def main():
    files = []
    for ext in ['*.jsx', '*.js']:
        files.extend(glob.glob(os.path.join(COACH_DIR, '**', ext), recursive=True))

    files.sort()
    changed = 0

    for filepath in files:
        result = process_file(filepath)
        if result:
            changed += 1

    print(f"\n✅ Done! Changed {changed}/{len(files)} files.")

if __name__ == '__main__':
    main()
