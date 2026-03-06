"""Chat and workflow execution API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Stack, ChatMessage
from app.models.schemas import ChatRequest, ChatMessageResponse, WorkflowValidation
from app.services.workflow_engine import workflow_engine

router = APIRouter(prefix="/api/stacks/{stack_id}", tags=["chat"])


@router.post("/validate", response_model=WorkflowValidation)
def validate_workflow(stack_id: str, db: Session = Depends(get_db)):
    """Validate a stack's workflow."""
    stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    is_valid, errors, warnings = workflow_engine.validate_workflow(
        stack.nodes or [], stack.edges or []
    )

    return WorkflowValidation(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings
    )


@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_stack(
    stack_id: str,
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Execute the workflow with a user query and return the response."""
    stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    # Use the workflow from the request (includes latest configs)
    nodes = chat_request.workflow.get("nodes", stack.nodes or [])
    edges = chat_request.workflow.get("edges", stack.edges or [])

    # Validate
    is_valid, errors, _ = workflow_engine.validate_workflow(nodes, edges)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid workflow: {'; '.join(errors)}"
        )

    # Save user message
    user_msg = ChatMessage(
        stack_id=stack_id,
        role="user",
        content=chat_request.query
    )
    db.add(user_msg)
    db.commit()

    # Execute workflow
    try:
        result = await workflow_engine.execute(
            query=chat_request.query,
            nodes=nodes,
            edges=edges,
            stack_id=stack_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution error: {str(e)}")

    # Save assistant message
    assistant_msg = ChatMessage(
        stack_id=stack_id,
        role="assistant",
        content=result.get("response", ""),
        sources=result.get("sources", [])
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg


@router.get("/chat/history", response_model=List[ChatMessageResponse])
def get_chat_history(stack_id: str, db: Session = Depends(get_db)):
    """Get chat history for a stack."""
    messages = db.query(ChatMessage).filter(
        ChatMessage.stack_id == stack_id
    ).order_by(ChatMessage.created_at).all()
    return messages


@router.delete("/chat/history")
def clear_chat_history(stack_id: str, db: Session = Depends(get_db)):
    """Clear chat history for a stack."""
    db.query(ChatMessage).filter(ChatMessage.stack_id == stack_id).delete()
    db.commit()
    return {"message": "Chat history cleared"}
