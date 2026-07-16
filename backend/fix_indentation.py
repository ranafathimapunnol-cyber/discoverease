with open('guides/views.py', 'r') as f:
    lines = f.readlines()

# Find and fix the get_queryset method
fixed_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if this is the start of get_queryset method
    if 'def get_queryset(self):' in line:
        fixed_lines.append(line)
        i += 1
        # Skip any malformed lines and add proper indentation
        # Add the first line with proper indentation
        if i < len(lines) and not lines[i].strip().startswith('"""') and not lines[i].strip().startswith('#'):
            fixed_lines.append('        queryset = super().get_queryset()\n')
            # Skip the next line if it's the same as what we just added
            if i < len(lines) and 'super().get_queryset()' in lines[i]:
                i += 1
            continue
    else:
        fixed_lines.append(line)
        i += 1

with open('guides/views.py', 'w') as f:
    f.writelines(fixed_lines)

print("✅ Fixed indentation")
