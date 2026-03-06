from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Stack(Base):
    __tablename__ = "stacks"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    nodes = Column(JSON, nullable=True, default=list)
    edges = Column(JSON, nullable=True, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    documents = relationship("Document", back_populates="stack", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="stack", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    stack_id = Column(String, ForeignKey("stacks.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(500), nullable=False)
    filepath = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=True)
    content_hash = Column(String(64), nullable=True)
    chunk_count = Column(Integer, default=0)
    status = Column(String(50), default="uploaded")  # uploaded, processing, processed, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stack = relationship("Stack", back_populates="documents")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    stack_id = Column(String, ForeignKey("stacks.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stack = relationship("Stack", back_populates="chat_messages")
