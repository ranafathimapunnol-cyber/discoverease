# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'role', 'bio', 'profile_picture', 'profile_picture_upload',
            'profile_picture_url', 'total_trips', 'email_verified', 
            'is_active', 'is_deleted', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'email_verified', 'is_active', 'is_deleted',
            'created_at', 'updated_at'
        ]
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture_upload:
            try:
                return obj.profile_picture_upload.url
            except:
                return None
        return obj.profile_picture or None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.TOURISTER)
    email = serializers.EmailField()
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'confirm_password', 
            'first_name', 'last_name', 'phone', 'role'
        ]
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
        }

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })
        
        email = data.get('email')
        if email:
            if User.objects.filter(email=email).exists():
                existing_user = User.objects.get(email=email)
                role = existing_user.get_role()
                raise serializers.ValidationError({
                    "email": f"This email is already registered as a {role}. Please login or use a different email."
                })
        
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]
        
        username = validated_data['username']
        if User.objects.filter(username=username).exists():
            import random
            validated_data['username'] = f"{username}_{random.randint(100, 999)}"
        
        user = User.objects.create_user(**validated_data)
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'bio',
            'profile_picture', 'profile_picture_upload'
        ]