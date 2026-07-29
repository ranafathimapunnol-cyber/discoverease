# ai/embeddings.py

#t This library converts text into vectors.
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        logger.info("Loading embedding model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dim = self.model.encode(["test"]).shape[1]
        logger.info(f"✅ Embedding model loaded. Dimension: {self.dim}")
    
    def embed(self, text: str):
        if not text:
            return []
        return self.model.encode(text, normalize_embeddings=True).tolist()
    
    def embed_batch(self, texts):
        if not texts:
            return []
        return self.model.encode(texts, normalize_embeddings=True, batch_size=32).tolist()
    
    def embed_query(self, query: str):
        return self.embed(query)


# Create singleton instance
embedding_service = EmbeddingService()