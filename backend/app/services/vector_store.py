"""Embedding and vector store service using ChromaDB."""
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Optional
import os
from app.core.config import settings


class VectorStoreService:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )

    def _get_collection_name(self, stack_id: str) -> str:
        """Generate a collection name for a stack."""
        return f"stack_{stack_id.replace('-', '_')}"

    def store_embeddings(
        self,
        stack_id: str,
        document_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        filename: str
    ):
        """Store document chunks and their embeddings in ChromaDB."""
        collection_name = self._get_collection_name(stack_id)
        collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {"document_id": document_id, "filename": filename, "chunk_index": i}
            for i in range(len(chunks))
        ]

        # ChromaDB has a max batch size, so we batch if needed
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            end = min(i + batch_size, len(chunks))
            collection.add(
                ids=ids[i:end],
                documents=chunks[i:end],
                embeddings=embeddings[i:end],
                metadatas=metadatas[i:end]
            )

    def query_similar(
        self,
        stack_id: str,
        query_embedding: List[float],
        n_results: int = 5
    ) -> dict:
        """Query similar documents from the vector store."""
        collection_name = self._get_collection_name(stack_id)
        try:
            collection = self.client.get_collection(name=collection_name)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )
            return results
        except Exception:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

    def delete_collection(self, stack_id: str):
        """Delete a stack's collection from ChromaDB."""
        collection_name = self._get_collection_name(stack_id)
        try:
            self.client.delete_collection(name=collection_name)
        except Exception:
            pass

    def delete_document_embeddings(self, stack_id: str, document_id: str):
        """Delete all embeddings for a specific document."""
        collection_name = self._get_collection_name(stack_id)
        try:
            collection = self.client.get_collection(name=collection_name)
            # Get all IDs that match this document
            results = collection.get(
                where={"document_id": document_id},
                include=[]
            )
            if results["ids"]:
                collection.delete(ids=results["ids"])
        except Exception:
            pass


vector_store = VectorStoreService()
