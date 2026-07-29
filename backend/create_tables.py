import sys
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.core.management import call_command

print("Creating guide tables...")

with connection.cursor() as cursor:
    # Create District table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guides_district (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            code VARCHAR(10) UNIQUE NOT NULL,
            description TEXT NOT NULL,
            image VARCHAR(100),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
    """)
    print("✅ Created guides_district")

    # Create GuideCategory table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guides_guidecategory (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            icon VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
    """)
    print("✅ Created guides_guidecategory")

    # Create Guide table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guides_guide (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            full_name VARCHAR(200) NOT NULL,
            profile_image VARCHAR(100),
            bio TEXT NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            email VARCHAR(254) NOT NULL,
            years_of_experience INTEGER NOT NULL DEFAULT 0,
            languages VARCHAR(200) NOT NULL,
            rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
            total_reviews INTEGER NOT NULL DEFAULT 0,
            price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            is_available BOOLEAN NOT NULL DEFAULT TRUE,
            is_verified BOOLEAN NOT NULL DEFAULT FALSE,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            facebook VARCHAR(200),
            instagram VARCHAR(200),
            twitter VARCHAR(200),
            website VARCHAR(200),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
            verified_by_id INTEGER REFERENCES users(id)
        )
    """)
    print("✅ Created guides_guide")

    # Create GuideAvailability table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guides_guideavailability (
            id SERIAL PRIMARY KEY,
            guide_id INTEGER NOT NULL REFERENCES guides_guide(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_booked BOOLEAN NOT NULL DEFAULT FALSE,
            max_bookings INTEGER NOT NULL DEFAULT 1,
            current_bookings INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
            UNIQUE(guide_id, date, start_time)
        )
    """)
    print("✅ Created guides_guideavailability")

    # Create GuideBooking table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guides_guidebooking (
            id SERIAL PRIMARY KEY,
            booking_id VARCHAR(20) NOT NULL UNIQUE,
            guide_id INTEGER NOT NULL REFERENCES guides_guide(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            district_id INTEGER NOT NULL REFERENCES guides_district(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES guides_guidecategory(id) ON DELETE SET NULL,
            availability_id INTEGER REFERENCES guides_guideavailability(id) ON DELETE SET NULL,
            date DATE NOT NULL,
            time TIME NOT NULL,
            duration_hours INTEGER NOT NULL DEFAULT 2,
            number_of_people INTEGER NOT NULL DEFAULT 1,
            special_requests TEXT NOT NULL,
            total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            currency VARCHAR(3) NOT NULL DEFAULT 'USD',
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
    """)
    print("✅ Created guides_guidebooking")

    # Create many-to-many tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guides_guide_districts (
            id SERIAL PRIMARY KEY,
            guide_id INTEGER NOT NULL REFERENCES guides_guide(id) ON DELETE CASCADE,
            district_id INTEGER NOT NULL REFERENCES guides_district(id) ON DELETE CASCADE,
            UNIQUE(guide_id, district_id)
        )
    """)
    print("✅ Created guides_guide_districts")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guides_guide_categories (
            id SERIAL PRIMARY KEY,
            guide_id INTEGER NOT NULL REFERENCES guides_guide(id) ON DELETE CASCADE,
            guidecategory_id INTEGER NOT NULL REFERENCES guides_guidecategory(id) ON DELETE CASCADE,
            UNIQUE(guide_id, guidecategory_id)
        )
    """)
    print("✅ Created guides_guide_categories")

# Verify
tables = connection.introspection.table_names()
guide_tables = [t for t in tables if 'guide' in t.lower()]
print(f"\nGuide tables: {guide_tables}")

