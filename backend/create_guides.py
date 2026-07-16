from guides.models import Guide, District
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

# Get or create admin
admin, created = User.objects.get_or_create(
    email='admin@discoverease.com',
    defaults={
        'username': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True,
        'email_verified': True
    }
)
if created:
    admin.set_password('admin123')
    admin.save()
    print(f"✅ Created admin: {admin.email}")

# List of 14 guides
guides_data = [
    {'email': 'guidekasaragod@gmail.com', 'username': 'guidekasaragod', 'district': 'Kasaragod', 'full_name': 'Guide Kasaragod'},
    {'email': 'guidekannur@gmail.com', 'username': 'guidekannur', 'district': 'Kannur', 'full_name': 'Guide Kannur'},
    {'email': 'guidewayanad@gmail.com', 'username': 'guidewayanad', 'district': 'Wayanad', 'full_name': 'Guide Wayanad'},
    {'email': 'guidekozhikode@gmail.com', 'username': 'guidekozhikode', 'district': 'Kozhikode', 'full_name': 'Guide Kozhikode'},
    {'email': 'guidemalappuram@gmail.com', 'username': 'guidemalappuram', 'district': 'Malappuram', 'full_name': 'Guide Malappuram'},
    {'email': 'guidepalakkad@gmail.com', 'username': 'guidepalakkad', 'district': 'Palakkad', 'full_name': 'Guide Palakkad'},
    {'email': 'guidethrissur@gmail.com', 'username': 'guidethrissur', 'district': 'Thrissur', 'full_name': 'Guide Thrissur'},
    {'email': 'guideernakulam@gmail.com', 'username': 'guideernakulam', 'district': 'Ernakulam', 'full_name': 'Guide Ernakulam'},
    {'email': 'guideidukki@gmail.com', 'username': 'guideidukki', 'district': 'Idukki', 'full_name': 'Guide Idukki'},
    {'email': 'guidekottayam@gmail.com', 'username': 'guidekottayam', 'district': 'Kottayam', 'full_name': 'Guide Kottayam'},
    {'email': 'guidealappuzha@gmail.com', 'username': 'guidealappuzha', 'district': 'Alappuzha', 'full_name': 'Guide Alappuzha'},
    {'email': 'guidepathanamthitta@gmail.com', 'username': 'guidepathanamthitta', 'district': 'Pathanamthitta', 'full_name': 'Guide Pathanamthitta'},
    {'email': 'guidekollam@gmail.com', 'username': 'guidekollam', 'district': 'Kollam', 'full_name': 'Guide Kollam'},
    {'email': 'guidethiruvananthapuram@gmail.com', 'username': 'guidethiruvananthapuram', 'district': 'Thiruvananthapuram', 'full_name': 'Guide Thiruvananthapuram'},
]

print("\n📌 Creating 14 guides...")
print("="*50)

created_count = 0
updated_count = 0

with transaction.atomic():
    for data in guides_data:
        # Create user
        user, created = User.objects.get_or_create(
            email=data['email'],
            defaults={
                'username': data['username'],
                'role': 'guide',
                'is_active': True,
                'email_verified': True,
                'first_name': data['full_name'].split()[0] if ' ' in data['full_name'] else data['full_name'],
                'last_name': data['full_name'].split()[-1] if ' ' in data['full_name'] else '',
            }
        )
        
        user.set_password('punnolil')
        user.save()
        
        if created:
            print(f"✅ Created user: {user.email}")
        else:
            print(f"🔄 Updated user: {user.email}")
        
        # Get district
        try:
            district = District.objects.get(name=data['district'])
        except District.DoesNotExist:
            print(f"⚠️ District not found: {data['district']}, skipping...")
            continue
        
        # Create guide
        guide, created = Guide.objects.get_or_create(
            user=user,
            defaults={
                'full_name': data['full_name'],
                'email': data['email'],
                'phone_number': '1234567890',
                'bio': f'Experienced local guide for {data["district"]} district. Expert in off-the-beaten-path experiences.',
                'years_of_experience': 5,
                'languages': 'English, Malayalam, Hindi',
                'price_per_day': 5000,
                'price_per_hour': 800,
                'is_verified': True,
                'is_active': True,
                'verified_by': admin,
                'rating': 4.8,
                'total_reviews': 0,
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Created guide: {guide.full_name}")
        else:
            updated_count += 1
            guide.full_name = data['full_name']
            guide.is_verified = True
            guide.is_active = True
            guide.verified_by = admin
            guide.save()
            print(f"🔄 Updated guide: {guide.full_name}")
        
        # Assign district
        guide.districts.clear()
        guide.districts.add(district)
        print(f"  📍 Assigned to: {district.name}")

print("\n" + "="*50)
print("🎉 GUIDE CREATION COMPLETE!")
print("="*50)
print(f"✅ Created: {created_count} guides")
print(f"🔄 Updated: {updated_count} guides")
print(f"📊 Total guides: {Guide.objects.count()}")
print("="*50)

# Verify
print("\n📋 Final Guide List:")
for guide in Guide.objects.filter(is_active=True).order_by('full_name'):
    districts = [d.name for d in guide.districts.all()]
    print(f"  🧑‍🏫 {guide.full_name} ({guide.email})")
    print(f"     📍 District: {districts[0] if districts else '⚠️ NONE!'}")
    print(f"     🔑 Password: punnolil")
    print("-"*40)
