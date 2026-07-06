# suggestions/serializers.py
from rest_framework import serializers
from .models import Suggestion
from accounts.models import User

class SuggestionSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    suggestion_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Suggestion
        fields = [
            'id', 'user', 'username', 'user_email', 
            'suggestion_type', 'suggestion_type_display',
            'status', 'status_display',
            'name', 'description', 'category', 'location_info',
            'destination', 'update_data', 'reason',
            'admin_notes', 'processed_by', 'processed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'processed_by', 'processed_at']
    
    def get_username(self, obj):
        return obj.user.username if obj.user else None
    
    def get_user_email(self, obj):
        return obj.user.email if obj.user else None
    
    def get_status_display(self, obj):
        return dict(Suggestion.Status.choices).get(obj.status, obj.status)
    
    def get_suggestion_type_display(self, obj):
        return dict(Suggestion.SuggestionType.choices).get(obj.suggestion_type, obj.suggestion_type)