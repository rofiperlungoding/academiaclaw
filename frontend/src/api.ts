import type {
  DocumentItem,
  KnowledgeGraphData,
  Flashcard,
  RetentionStats,
  ReviewResponse,
  AcademicTask,
  HeartbeatSummary,
  GatewayStatus,
  ModelItem
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export const api = {
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/knowledge/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(file: File, title?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/knowledge/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  async getGraph(docId?: string): Promise<KnowledgeGraphData> {
    const url = docId ? `${API_BASE}/knowledge/graph?doc_id=${docId}` : `${API_BASE}/knowledge/graph`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch knowledge graph');
    return res.json();
  },

  async askRag(query: string, docIds?: string[]): Promise<{
    query: string;
    answer: string;
    low_level_facts: any[];
    high_level_topics: any[];
    used_model: string;
  }> {
    const res = await fetch(`${API_BASE}/knowledge/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, doc_ids: docIds }),
    });
    if (!res.ok) throw new Error('Failed to query Dual-Level RAG');
    return res.json();
  },

  async deleteDocument(docId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/knowledge/documents/${docId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async getFlashcards(dueOnly = false, docId?: string): Promise<Flashcard[]> {
    let url = `${API_BASE}/flashcards?due_only=${dueOnly}`;
    if (docId) url += `&doc_id=${docId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch flashcards');
    return res.json();
  },

  async getRetentionStats(): Promise<RetentionStats> {
    const res = await fetch(`${API_BASE}/flashcards/stats`);
    if (!res.ok) throw new Error('Failed to fetch retention stats');
    return res.json();
  },

  async submitReview(cardId: string, rating: number): Promise<ReviewResponse> {
    const res = await fetch(`${API_BASE}/flashcards/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: cardId, rating }),
    });
    if (!res.ok) throw new Error('Failed to submit card review');
    return res.json();
  },

  async createFlashcard(data: { question: string; answer: string; card_type?: string; doc_id?: string }): Promise<Flashcard> {
    const res = await fetch(`${API_BASE}/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create flashcard');
    return res.json();
  },

  async deleteFlashcard(cardId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/flashcards/${cardId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete flashcard');
  },

  async getTasks(status?: string, course?: string): Promise<AcademicTask[]> {
    let url = `${API_BASE}/tasks`;
    const params = [];
    if (status) params.push(`status=${status}`);
    if (course) params.push(`course=${encodeURIComponent(course)}`);
    if (params.length) url += `?${params.join('&')}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async createTask(data: {
    title: string;
    course: string;
    task_type: string;
    deadline: string;
    priority?: string;
    notes?: string;
  }): Promise<AcademicTask> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(taskId: string, data: Partial<AcademicTask>): Promise<AcademicTask> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(taskId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async getHeartbeatSummary(): Promise<HeartbeatSummary> {
    const res = await fetch(`${API_BASE}/tasks/heartbeat/summary`);
    if (!res.ok) throw new Error('Failed to fetch heartbeat summary');
    return res.json();
  },

  async getGatewayStatus(): Promise<GatewayStatus> {
    const res = await fetch(`${API_BASE}/agent/gateway-status`);
    if (!res.ok) throw new Error('Failed to fetch gateway status');
    return res.json();
  },

  async getModels(): Promise<ModelItem[]> {
    const res = await fetch(`${API_BASE}/agent/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
  },

  async chatWithAgent(message: string, sessionId = 'main', model?: string, contextMode = 'academic_tutor'): Promise<{
    reply: string;
    session_id: string;
    model: string;
  }> {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId, model, context_mode: contextMode }),
    });
    if (!res.ok) throw new Error('Failed to send message to agent');
    return res.json();
  },
};
