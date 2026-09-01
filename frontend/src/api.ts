import type {
  User,
  AuthResponse,
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

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('academiaclaw_token');
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // ——— AUTHENTICATION APIS ———
  async login(nim: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'NIM atau password salah.');
    }
    const data: AuthResponse = await res.json();
    if (data.access_token) {
      localStorage.setItem('academiaclaw_token', data.access_token);
    }
    return data;
  },

  async register(payload: {
    nim: string;
    name: string;
    password: string;
    email?: string;
    faculty?: string;
    program?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Gagal mendaftarkan akun.');
    }
    const data: AuthResponse = await res.json();
    if (data.access_token) {
      localStorage.setItem('academiaclaw_token', data.access_token);
    }
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  // ——— KNOWLEDGE & RAG APIS ———
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/knowledge/documents`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(file: File, title?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/knowledge/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    const res = await fetch(url, { headers: getAuthHeaders() });
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query, doc_ids: docIds }),
    });
    if (!res.ok) throw new Error('Failed to query Dual-Level RAG');
    return res.json();
  },

  async deleteDocument(docId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/knowledge/documents/${docId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  // ——— FSRS-6 FLASHCARD APIS ———
  async getFlashcards(dueOnly = false, docId?: string): Promise<Flashcard[]> {
    let url = `${API_BASE}/flashcards?due_only=${dueOnly}`;
    if (docId) url += `&doc_id=${docId}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch flashcards');
    return res.json();
  },

  async getRetentionStats(): Promise<RetentionStats> {
    const res = await fetch(`${API_BASE}/flashcards/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch retention stats');
    return res.json();
  },

  async submitReview(cardId: string, rating: number): Promise<ReviewResponse> {
    const res = await fetch(`${API_BASE}/flashcards/review`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ card_id: cardId, rating }),
    });
    if (!res.ok) throw new Error('Failed to submit card review');
    return res.json();
  },

  async createFlashcard(data: { question: string; answer: string; card_type?: string; doc_id?: string }): Promise<Flashcard> {
    const res = await fetch(`${API_BASE}/flashcards`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create flashcard');
    return res.json();
  },

  async deleteFlashcard(cardId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/flashcards/${cardId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete flashcard');
  },

  // ——— ACADEMIC TASKS APIS ———
  async getTasks(status?: string, course?: string): Promise<AcademicTask[]> {
    let url = `${API_BASE}/tasks`;
    const params = [];
    if (status) params.push(`status=${status}`);
    if (course) params.push(`course=${encodeURIComponent(course)}`);
    if (params.length) url += `?${params.join('&')}`;

    const res = await fetch(url, { headers: getAuthHeaders() });
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(taskId: string, data: Partial<AcademicTask>): Promise<AcademicTask> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(taskId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async getHeartbeatSummary(): Promise<HeartbeatSummary> {
    const res = await fetch(`${API_BASE}/tasks/heartbeat/summary`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch heartbeat summary');
    return res.json();
  },

  // ——— OPENCLAW AGENT APIS ———
  async getGatewayStatus(): Promise<GatewayStatus> {
    const res = await fetch(`${API_BASE}/agent/gateway-status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch gateway status');
    return res.json();
  },

  async getModels(): Promise<ModelItem[]> {
    const res = await fetch(`${API_BASE}/agent/models`, {
      headers: getAuthHeaders(),
    });
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message, session_id: sessionId, model, context_mode: contextMode }),
    });
    if (!res.ok) throw new Error('Failed to send message to agent');
    return res.json();
  },

  async getPrompts(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/agent/prompts`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch agent prompts');
    return res.json();
  },

  async pingGateway(): Promise<{
    success: boolean;
    status_code?: number;
    latency_ms: number;
    url: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/agent/ping`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to ping gateway');
    return res.json();
  },
};
