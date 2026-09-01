from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class FlashcardBase(BaseModel):
    question: str
    answer: str
    card_type: str = "concept"
    doc_id: Optional[str] = None
    topic_id: Optional[str] = None

class FlashcardCreate(FlashcardBase):
    pass

class FlashcardResponse(FlashcardBase):
    id: str
    difficulty: float
    stability: float
    retrievability: float
    reps: int
    lapses: int
    state: int
    due: datetime
    last_review: Optional[datetime] = None
    created_at: datetime

class ReviewRequest(BaseModel):
    card_id: str
    rating: int = Field(..., ge=1, le=4)

class ReviewResponse(BaseModel):
    card_id: str
    rating: int
    new_difficulty: float
    new_stability: float
    new_retrievability: float
    next_due: datetime
    interval_days: int

class RetentionStats(BaseModel):
    total_cards: int
    due_today: int
    new_cards: int
    learning_cards: int
    review_cards: int
    average_retrievability: float
    retention_forecast_7d: List[Dict[str, Any]]

class EntitySchema(BaseModel):
    id: str
    name: str
    entity_type: str
    description: str

class RelationSchema(BaseModel):
    id: str
    source_name: str
    target_name: str
    relation_type: str
    description: str
    weight: float = 1.0

class TopicSchema(BaseModel):
    id: str
    title: str
    summary: str
    key_entities: List[str]

class KnowledgeGraphResponse(BaseModel):
    doc_id: str
    doc_title: str
    entities: List[EntitySchema]
    relations: List[RelationSchema]
    topics: List[TopicSchema]
    total_nodes: int
    total_edges: int

class DocumentResponse(BaseModel):
    id: str
    title: str
    filename: str
    file_size: int
    summary: str
    created_at: datetime
    entities_count: int
    relations_count: int
    topics_count: int

class AskRagRequest(BaseModel):
    query: str
    mode: str = "hybrid"
    doc_ids: Optional[List[str]] = None

class AskRagResponse(BaseModel):
    query: str
    answer: str
    low_level_facts: List[Dict[str, Any]]
    high_level_topics: List[Dict[str, Any]]
    used_model: str

class TaskCreate(BaseModel):
    title: str
    course: str
    task_type: str
    deadline: datetime
    priority: str = "medium"
    notes: Optional[str] = ""
    source_doc_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    course: Optional[str] = None
    task_type: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    course: str
    task_type: str
    deadline: datetime
    priority: str
    status: str
    notes: str
    source_doc_id: Optional[str] = None
    created_at: datetime

class AgentChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "main"
    model: Optional[str] = None
    context_mode: str = "academic_tutor"

class AgentChatResponse(BaseModel):
    reply: str
    session_id: str
    model: str
    tool_calls: Optional[List[Dict[str, Any]]] = None

class GatewayHealthResponse(BaseModel):
    status: str
    gateway_reachable: bool
    gateway_url: str
    active_agent: str
    active_model: str
    uptime_info: Optional[str] = None
