"""Stack (workflow) CRUD API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Stack
from app.models.schemas import StackCreate, StackUpdate, StackResponse
from app.services.vector_store import vector_store

router = APIRouter(prefix="/api/stacks", tags=["stacks"])


@router.get("/", response_model=List[StackResponse])
def list_stacks(db: Session = Depends(get_db)):
    """List all stacks."""
    stacks = db.query(Stack).order_by(Stack.updated_at.desc()).all()
    return stacks


@router.post("/", response_model=StackResponse)
def create_stack(stack_data: StackCreate, db: Session = Depends(get_db)):
    """Create a new stack."""
    stack = Stack(
        name=stack_data.name,
        description=stack_data.description,
        nodes=[],
        edges=[]
    )
    db.add(stack)
    db.commit()
    db.refresh(stack)
    return stack


@router.get("/{stack_id}", response_model=StackResponse)
def get_stack(stack_id: str, db: Session = Depends(get_db)):
    """Get a specific stack."""
    stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    return stack


@router.put("/{stack_id}", response_model=StackResponse)
def update_stack(stack_id: str, stack_data: StackUpdate, db: Session = Depends(get_db)):
    """Update a stack (including nodes and edges)."""
    stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    update_data = stack_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(stack, key, value)

    db.commit()
    db.refresh(stack)
    return stack


@router.delete("/{stack_id}")
def delete_stack(stack_id: str, db: Session = Depends(get_db)):
    """Delete a stack and its associated data."""
    stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    # Clean up vector store
    vector_store.delete_collection(stack_id)

    db.delete(stack)
    db.commit()
    return {"message": "Stack deleted successfully"}
