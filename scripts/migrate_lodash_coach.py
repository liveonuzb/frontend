#!/usr/bin/env python3
"""
Migrate named lodash imports to full _ import in the coach module.
Changes:
  import { a, b, c } from "lodash"  =>  import _ from "lodash"
  a(...)                              =>  _.a(...)
"""

import re
import os
import glob

COACH_DIR = "/Users/shoxruxshomurodov/Desktop/liveon/web-app/src/modules/coach"

# All known lodash functions that might appear
LODASH_FUNCS = [
    "get", "map", "find", "filter", "includes", "size", "sumBy", "isEmpty", "isNil",
    "isArray", "keys", "values", "entries", "toLower", "trim", "split", "join", "toUpper",
    "find", "forEach", "some", "keys", "reduce", "clamp", "orderBy", "round", "replace",
    "slice", "toNumber", "toString", "concat", "groupBy", "take", "times", "isEqual",
    "compact", "flatten", "uniq", "pick", "omit", "merge", "assignIn", "set", "has",
    "head", "tail", "last", "first", "debounce", "throttle", "chunk", "zip", "zipObject",
    "fromPairs", "toPairs", "sortBy", "every", "any", "countBy", "flatMap", "keyBy",
    "mapValues", "mapKeys", "invert", "difference", "intersection", "union", "without",
    "sample", "shuffle", "min", "max", "sum", "mean", "cloneDeep", "clone", "isObject",
    "isString", "isNumber", "isBoolean", "isFunction", "isUndefined", "isNull", "identity",
    "noop", "constant", "times", "range",
]

def extract_lodash_names(import_str):
    """Extract function names from a lodash import statement."""
    match = re.search(r'import\s*\{([^}]+)\}\s*from\s*["\']lodash(?:/[^"\']*)?["\']', import_str)
    if not match:
        return []
    names_str = match.group(1)
    names = [n.strip() for n in names_str.split(',') if n.strip()]
    return names

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if there's a named lodash import
    pattern = r'import\s*\{[^}]+\}\s*from\s*["\']lodash["\'];?\n?'
    matches = list(re.finditer(pattern, content))
    
    if not matches:
        print(f"  SKIP (no named lodash import): {filepath}")
        return False

    # Collect all imported names across all lodash import statements
    all_names = []
    for m in matches:
        names = extract_lodash_names(m.group(0))
        all_names.extend(names)
    
    # Remove duplicates
    all_names = list(dict.fromkeys(all_names))
    
    print(f"  Processing: {filepath}")
    print(f"    Imported names: {all_names}")

    # Remove all named lodash imports
    new_content = re.sub(pattern, '', content)

    # Check if `import _ from "lodash"` already exists
    already_has_default = bool(re.search(r'import\s+_\s+from\s*["\']lodash["\']', new_content))
    
    # Find the first import line to insert our import after it
    # We'll insert `import _ from "lodash"` at the top (after any existing imports are done)
    if not already_has_default:
        # Find the position of the first existing import to insert before it
        first_import_match = re.search(r'^import\s', new_content, re.MULTILINE)
        if first_import_match:
            insert_pos = first_import_match.start()
            new_content = new_content[:insert_pos] + 'import _ from "lodash";\n' + new_content[insert_pos:]
        else:
            new_content = 'import _ from "lodash";\n' + new_content

    # Replace usages: funcName( => _.funcName(
    # But be careful not to replace method calls like obj.funcName or _.funcName
    for name in all_names:
        # Replace standalone function calls: name( -> _.name(
        # Use negative lookbehind for . and _ to avoid double replacement
        new_content = re.sub(
            r'(?<![.\w])' + re.escape(name) + r'(?=\s*\()',
            f'_.{name}',
            new_content
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"    Done!")
    return True

def main():
    # Find all jsx and js files in coach module
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
