"""Document upload and processing API routes."""
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.config import settings
from app.models.models import Document, Stack
from app.models.schemas import DocumentResponse
from app.services.document_service import document_processor
from app.services.llm_service import llm_service
from app.services.vector_store import vector_store

router = APIRouter(prefix="/api/stacks/{stack_id}/documents", tags=["documents"])


@router.get("/", response_model=List[DocumentResponse])
def list_documents(stack_id: str, db: Session = Depends(get_db)):
    """List all documents for a stack."""
    docs = db.query(Document).filter(Document.stack_id == stack_id).all()
    return docs


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    stack_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a document to a stack."""
    # Verify stack exists
    stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Save file
    doc_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{doc_id}{file_ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, safe_filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # Create document record
    document = Document(
        id=doc_id,
        stack_id=stack_id,
        filename=file.filename,
        filepath=filepath,
        file_size=len(content),
        status="uploaded"
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return document


@router.post("/{document_id}/process")
async def process_document(
    stack_id: str,
    document_id: str,
    db: Session = Depends(get_db),
    api_key: str = Query("", description="API key for embedding provider"),
    embedding_model: str = Query("text-embedding-3-small", description="Embedding model name"),
    provider: str = Query("openai", description="Embedding provider (openai or gemini)")
):
    """Process a document: extract text, generate embeddings, store in vector DB."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.stack_id == stack_id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        # Update status
        document.status = "processing"
        db.commit()

        # Extract text and chunk
        chunks, content_hash = document_processor.process_document(document.filepath)

        if not chunks:
            raise HTTPException(status_code=400, detail="No text could be extracted from the document")

        # Generate embeddings
        if provider == "openai":
            embeddings = await llm_service.get_openai_embeddings(chunks, api_key, embedding_model)
        else:
            embeddings = await llm_service.get_gemini_embeddings(chunks, api_key, embedding_model)

        # Store in vector DB
        vector_store.store_embeddings(
            stack_id=stack_id,
            document_id=document_id,
            chunks=chunks,
            embeddings=embeddings,
            filename=document.filename
        )

        # Update document record
        document.content_hash = content_hash
        document.chunk_count = len(chunks)
        document.status = "processed"
        db.commit()

        return {
            "message": "Document processed successfully",
            "chunk_count": len(chunks),
            "document_id": document_id
        }

    except Exception as e:
        document.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.delete("/{document_id}")
def delete_document(
    stack_id: str,
    document_id: str,
    db: Session = Depends(get_db)
):
    """Delete a document and its embeddings."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.stack_id == stack_id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete embeddings
    vector_store.delete_document_embeddings(stack_id, document_id)

    # Delete file
    if os.path.exists(document.filepath):
        os.remove(document.filepath)

    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}
