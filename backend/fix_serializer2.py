import re

with open('guides/serializers.py', 'r') as f:
    content = f.read()

# Check if get_districts method exists
if 'def get_districts' not in content:
    # Add get_districts method to GuideListSerializer
    find_class = 'class GuideListSerializer'
    if find_class in content:
        # Find where to insert
        insert_point = content.find('def get_specialties')
        if insert_point != -1:
            # Insert get_districts method before get_specialties
            get_districts = '''
    def get_districts(self, obj):
        """Get districts as list of names"""
        return [d.name for d in obj.districts.all()]
'''
            content = content[:insert_point] + get_districts + content[insert_point:]
            with open('guides/serializers.py', 'w') as f:
                f.write(content)
            print("✅ Added get_districts method")
        else:
            # Try finding the end of Meta class
            meta_end = content.find('fields = [')
            if meta_end != -1:
                # Add the method after the Meta class
                get_districts = '''
    
    def get_districts(self, obj):
        """Get districts as list of names"""
        return [d.name for d in obj.districts.all()]
'''
                content = content[:meta_end] + get_districts + content[meta_end:]
                with open('guides/serializers.py', 'w') as f:
                    f.write(content)
                print("✅ Added get_districts method")
            else:
                print("⚠️ Could not find where to insert get_districts")
    else:
        print("⚠️ GuideListSerializer not found")
else:
    print("✅ get_districts already exists")

# Also fix the districts field to use SerializerMethodField
old_districts = 'districts = DistrictSerializer(many=True, read_only=True)'
new_districts = 'districts = serializers.SerializerMethodField()'

if old_districts in content:
    content = content.replace(old_districts, new_districts)
    with open('guides/serializers.py', 'w') as f:
        f.write(content)
    print("✅ Changed districts to SerializerMethodField")
