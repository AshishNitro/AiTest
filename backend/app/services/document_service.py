"""Document processing service - handles PDF text extraction and chunking."""
import fitz  # PyMuPDF
import hashlib
import os
from typing import List, Tuple
from langchain_text_splitters import RecursiveCharacterTextSplitter


class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def extract_text_from_pdf(self, filepath: str) -> str:
        """Extract text from a PDF file using PyMuPDF."""
        doc = fitz.open(filepath)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    def chunk_text(self, text: str) -> List[str]:
        """Split text into chunks for embedding."""
        chunks = self.text_splitter.split_text(text)
        return chunks

    def compute_hash(self, filepath: str) -> str:
        """Compute SHA256 hash of a file."""
        sha256 = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def process_document(self, filepath: str) -> Tuple[List[str], str]:
        """Process a document: extract text, chunk it, compute hash."""
        text = self.extract_text_from_pdf(filepath)
        chunks = self.chunk_text(text)
        content_hash = self.compute_hash(filepath)
        return chunks, content_hash


document_processor = DocumentProcessor()
