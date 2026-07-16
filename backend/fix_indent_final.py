with open('guides/views.py', 'r') as f:
    content = f.read()

# Fix the indentation of the get_queryset method
import re

# Find the incorrectly indented get_queryset method
pattern = r'(\s*)def get_queryset\(self\):'

def fix_indent(match):
    current_indent = match.group(1)
    # If it's indented more than 4 spaces, reduce to 4
    if len(current_indent) > 4:
        return '    def get_queryset(self):'
    return match.group(0)

content = re.sub(pattern, fix_indent, content)

# Fix the indentation of the entire method body
lines = content.split('\n')
fixed_lines = []
in_method = False
method_indent = 4

for i, line in enumerate(lines):
    # Check if this is the start of get_queryset
    if 'def get_queryset(self):' in line:
        in_method = True
        fixed_lines.append('    def get_queryset(self):')
        continue
    
    # If we're in the method, fix indentation
    if in_method:
        # Check if we've reached the end of the method
        if line.strip() and not line.startswith('        ') and line.strip().startswith('def '):
            in_method = False
            fixed_lines.append(line)
            continue
        
        if line.strip():
            # Remove existing indentation and add proper 8 spaces
            stripped = line.lstrip()
            if stripped and not stripped.startswith('#'):
                fixed_lines.append('        ' + stripped)
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
        
        # Check for the return statement to end the method
        if 'return queryset' in line:
            in_method = False
        continue
    
    fixed_lines.append(line)

content = '\n'.join(fixed_lines)

with open('guides/views.py', 'w') as f:
    f.write(content)

print("✅ Fixed indentation of get_queryset method")
