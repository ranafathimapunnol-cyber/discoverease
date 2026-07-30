# ai/apps.py

from django.apps import AppConfig
from django.db.models.signals import post_migrate
import logging

logger = logging.getLogger(__name__)


class AiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai'
    
    def ready(self):
        """Initialize vector store when app is ready"""
        # Import here to avoid circular imports
        from .init_data import initialize_vector_store
        
        # Connect to post_migrate signal
        post_migrate.connect(initialize_vector_store, sender=self)
        
        # This ensures data is indexed when the server starts (not just after migrations)
        import sys
        if 'migrate' not in sys.argv and 'makemigrations' not in sys.argv:
            try:
                from .init_data import run_indexing
                run_indexing()
            except Exception as e:
                logger.error(f"❌ Failed to run indexing: {e}")