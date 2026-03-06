from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ── Stack Schemas ────────────────────────────────────────────
class StackCreate(BaseModel):
    name: str
    description: Optional[str] = None


class StackUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Any]] = None
    edges: Optional[List[Any]] = None


class StackResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    nodes: Optional[List[Any]]
    edges: Optional[List[Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Document Schemas ─────────────────────────────────────────
class DocumentResponse(BaseModel):
    id: str
    stack_id: str
    filename: str
    file_size: Optional[int]
    chunk_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Chat Schemas ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str
    workflow: dict  # Contains nodes and edges with their configs


class ChatMessageResponse(BaseModel):
    id: str
    stack_id: str
    role: str
    content: str
    sources: Optional[List[Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Workflow Execution Schemas ───────────────────────────────
class WorkflowNode(BaseModel):
    id: str
    type: str
    data: dict
    position: Optional[dict] = None


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class WorkflowValidation(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
