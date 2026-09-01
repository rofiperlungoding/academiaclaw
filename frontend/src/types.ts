export interface Entity {
  id: string;
  name: string;
  entity_type: string;
  description: string;
}

export interface Relation {
  id: string;
  source_name: string;
  target_name: string;
  relation_type: string;
  description: string;
  weight: number;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  key_entities: string[];
}

export interface KnowledgeGraphData {
  doc_id: string;
  doc_title: string;
  entities: Entity[];
  relations: Relation[];
  topics: Topic[];
  total_nodes: number;
  total_edges: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  summary: string;
  created_at: string;
  entities_count: number;
  relations_count: number;
  topics_count: number;
}

export interface Flashcard {
  id: string;
  doc_id?: string;
  topic_id?: string;
  question: string;
  answer: string;
  card_type: string;
  difficulty: number;
  stability: number;
  retrievability: number;
  reps: number;
  lapses: number;
  state: number;
  due: string;
  last_review?: string;
  created_at: string;
}

export interface RetentionStats {
  total_cards: number;
  due_today: number;
  new_cards: number;
  learning_cards: number;
  review_cards: number;
  average_retrievability: number;
  retention_forecast_7d: Array<{
    day_offset: number;
    date: string;
    due_cards: number;
    projected_retention: number;
  }>;
}

export interface ReviewResponse {
  card_id: string;
  rating: number;
  new_difficulty: number;
  new_stability: number;
  new_retrievability: number;
  next_due: string;
  interval_days: number;
}

export interface AcademicTask {
  id: string;
  title: string;
  course: string;
  task_type: string;
  deadline: string;
  priority: string;
  status: string;
  notes: string;
  source_doc_id?: string;
  created_at: string;
}

export interface HeartbeatSummary {
  timestamp: string;
  urgent_tasks_count: number;
  due_flashcards_count: number;
  urgent_tasks: Array<{
    id: string;
    title: string;
    course: string;
    deadline: string;
    priority: string;
  }>;
  proactive_notification_recommended: boolean;
}

export interface GatewayStatus {
  status: string;
  gateway_reachable: boolean;
  gateway_url: string;
  active_agent: string;
  active_model: string;
  uptime_info?: any;
}

export interface ModelItem {
  id: string;
  name: string;
  recommended?: boolean;
}
