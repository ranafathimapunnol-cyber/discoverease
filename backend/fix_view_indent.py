with open('suggestions/views.py', 'r') as f:
    content = f.read()

# Fix the indentation of the list method
# The problem: "def list" is indented with 12 spaces instead of 4

# Find and fix the list method indentation
import re

# Pattern to find the incorrectly indented list method
pattern = r'(\s*)def list\(self, request, \*args, \*\*kwargs\):'

def fix_indent(match):
    current_indent = match.group(1)
    # If it's indented more than 4 spaces, reduce to 4
    if len(current_indent) > 4:
        return '    def list(self, request, *args, **kwargs):'
    return match.group(0)

content = re.sub(pattern, fix_indent, content)

# Also fix the indentation of the docstring and try block
lines = content.split('\n')
fixed_lines = []
in_list_method = False
list_indent = 4  # Expected indent for list method

for i, line in enumerate(lines):
    # Check if we're in the list method
    if 'def list(self, request, *args, **kwargs):' in line:
        in_list_method = True
        list_indent = 4
        fixed_lines.append('    def list(self, request, *args, **kwargs):')
        continue
    
    # If we're in the list method, fix indentation
    if in_list_method:
        # Check if we've reached the end of the method (next def or @action)
        if line.strip().startswith('def ') or line.strip().startswith('@action'):
            in_list_method = False
            fixed_lines.append(line)
            continue
        
        # Fix indentation for lines inside the method
        if line.strip():
            # Calculate proper indent: base 4 spaces + 4 spaces for each level
            # For now, just ensure it has at least 8 spaces
            stripped = line.lstrip()
            if line.startswith(' ' * 8) or line.startswith(' ' * 12):
                # Already has some indent, keep it
                fixed_lines.append(line)
            elif line.startswith(' ' * 4):
                # Has 4 spaces, add 4 more for method body
                fixed_lines.append('    ' + line)
            elif not line.startswith(' '):
                # No indent, add 8 spaces
                fixed_lines.append('        ' + stripped)
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
        
        # Check for the try block end
        if line.strip() == '' and i + 1 < len(lines) and lines[i+1].strip().startswith('def '):
            in_list_method = False
        continue
    
    fixed_lines.append(line)

content = '\n'.join(fixed_lines)

with open('suggestions/views.py', 'w') as f:
    f.write(content)

print("✅ Fixed indentation in suggestions/views.py")
