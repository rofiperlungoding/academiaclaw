import networkx as nx
import httpx
import json
import re
import uuid
from typing import Dict, Any, List, Optional, Tuple
from backend.app.core.config import settings

class LightRAGEngine:
    def __init__(self):
        self.api_url = f"{settings.nine_router_base_url}/chat/completions"
        self.api_key = settings.nine_router_api_key
        self.model = settings.default_model

    async def _call_llm(self, prompt: str, system_prompt: str = "") -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt or "You are an expert academic knowledge graph architect."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 2048
        }
        
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(self.api_url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
        except Exception:
            pass

        return self._heuristic_fallback_extraction(prompt)

    def _heuristic_fallback_extraction(self, text: str) -> str:
        words = re.findall(r'\b[A-Z][a-zA-Z0-9_-]{2,}\b', text)
        top_words = list(dict.fromkeys(words))[:8]
        
        entities = [{"name": w, "type": "Concept", "description": f"Academic entity representing {w}"} for w in top_words]
        relations = []
        for i in range(len(top_words) - 1):
            relations.append({
                "source": top_words[i],
                "target": top_words[i+1],
                "relation": "relates_to",
                "description": f"{top_words[i]} correlates with {top_words[i+1]}"
            })
            
        topics = [{
            "title": "Materi Perkuliahan Terintegrasi",
            "summary": "Analisis terstruktur konsep kunci dan relasi materi.",
            "key_entities": top_words[:5]
        }]

        return json.dumps({
            "entities": entities,
            "relations": relations,
            "topics": topics,
            "tasks": []
        })

    async def extract_graph_and_topics(self, document_text: str, document_title: str) -> Dict[str, Any]:
        truncated_text = document_text[:7500]
        system_prompt = (
            "You are an academic LightRAG knowledge extractor. "
            "Extract structured knowledge in strictly valid JSON format only, with no markdown code blocks or additional text. "
            "JSON structure: {\n"
            '  "summary": "comprehensive 2-3 sentence overview",\n'
            '  "entities": [{"name": "Name", "type": "Concept/Algorithm/Architecture/Formula", "description": "precise explanation"}],\n'
            '  "relations": [{"source": "Name1", "target": "Name2", "relation": "implements/optimizes/requires/causes", "description": "how they connect"}],\n'
            '  "topics": [{"title": "High Level Theme", "summary": "Abstract topic overview", "key_entities": ["Name1", "Name2"]}],\n'
            '  "tasks": [{"title": "Task title", "course": "Course name", "task_type": "Tugas/Praktikum/Kuis/Laporan", "deadline_days": 5, "priority": "high/medium/low", "notes": "details"}],\n'
            '  "flashcards": [{"question": "Conceptual active recall question?", "answer": "Concise factual answer.", "card_type": "concept"}]\n'
            "}"
        )
        
        prompt = (
            f"Document Title: {document_title}\n\n"
            f"Document Content:\n{truncated_text}\n\n"
            "Extract low-level entities, multi-hop relations, high-level abstract topics, any academic deadlines/tasks mentioned, and 4-6 high-yield active recall flashcards."
        )

        raw_output = await self._call_llm(prompt, system_prompt)
        
        json_match = re.search(r'\{.*\}', raw_output, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                return parsed
            except Exception:
                pass
                
        fallback_json = json.loads(self._heuristic_fallback_extraction(truncated_text))
        fallback_json["summary"] = f"Ekstraksi materi: {document_title}"
        fallback_json["flashcards"] = [
            {
                "question": f"Apa definisi dan peran utama dari {e['name']}?",
                "answer": e['description'],
                "card_type": "concept"
            }
            for e in fallback_json.get("entities", [])[:4]
        ]
        return fallback_json

    def build_networkx_graph(self, entities: List[Dict[str, Any]], relations: List[Dict[str, Any]]) -> nx.DiGraph:
        graph = nx.DiGraph()
        for ent in entities:
            graph.add_node(ent["name"], entity_type=ent.get("entity_type", "Concept"), description=ent.get("description", ""))
        for rel in relations:
            graph.add_edge(
                rel["source_name"],
                rel["target_name"],
                relation=rel.get("relation_type", "relates_to"),
                description=rel.get("description", ""),
                weight=rel.get("weight", 1.0)
            )
        return graph

    def retrieve_dual_level_context(
        self,
        query: str,
        entities: List[Dict[str, Any]],
        relations: List[Dict[str, Any]],
        topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        query_lower = query.lower()
        graph = self.build_networkx_graph(entities, relations)
        
        matched_entities = []
        matched_names = set()
        
        for ent in entities:
            name = ent["name"]
            desc = ent.get("description", "")
            if name.lower() in query_lower or any(word in desc.lower() for word in query_lower.split() if len(word) > 3):
                matched_entities.append(ent)
                matched_names.add(name)

        multi_hop_neighbors = set()
        for name in matched_names:
            if graph.has_node(name):
                for neighbor in graph.neighbors(name):
                    multi_hop_neighbors.add(neighbor)
                for predecessor in graph.predecessors(name):
                    multi_hop_neighbors.add(predecessor)

        relevant_relations = []
        for rel in relations:
            s = rel["source_name"]
            t = rel["target_name"]
            if s in matched_names or t in matched_names or s in multi_hop_neighbors or t in multi_hop_neighbors:
                relevant_relations.append(rel)

        relevant_topics = []
        for top in topics:
            title = top["title"]
            summary = top["summary"]
            if any(word in title.lower() or word in summary.lower() for word in query_lower.split() if len(word) > 3):
                relevant_topics.append(top)
                
        if not relevant_topics and topics:
            relevant_topics = topics[:2]

        return {
            "low_level_entities": matched_entities[:10],
            "connected_neighbors": list(multi_hop_neighbors)[:10],
            "relations": relevant_relations[:15],
            "high_level_topics": relevant_topics[:5]
        }

    async def answer_rag_query(
        self,
        query: str,
        entities: List[Dict[str, Any]],
        relations: List[Dict[str, Any]],
        topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        context_bundle = self.retrieve_dual_level_context(query, entities, relations, topics)
        
        entities_text = "\n".join([f"- {e['name']} ({e.get('entity_type', 'Concept')}): {e.get('description', '')}" for e in context_bundle["low_level_entities"]])
        relations_text = "\n".join([f"- {r['source_name']} -> [{r.get('relation_type', 'rel')}] -> {r['target_name']}: {r.get('description', '')}" for r in context_bundle["relations"]])
        topics_text = "\n".join([f"- {t['title']}: {t.get('summary', '')}" for t in context_bundle["high_level_topics"]])

        system_prompt = (
            "You are AcademiaClaw, an advanced academic research and reasoning tutor. "
            "Answer the user query using Dual-Level LightRAG context provided: "
            "1. Ground your specific factual claims in Low-Level Entities and Graph Relations. "
            "2. Synthesize high-level thematic relationships across topics and chapters. "
            "Write in clear, authoritative, and direct language."
        )

        prompt = (
            f"User Question: {query}\n\n"
            f"[LOW-LEVEL KNOWLEDGE GRAPH TRIPLETS & ENTITIES]\n"
            f"{entities_text or 'No specific entity match'}\n\n"
            f"[GRAPH RELATIONS & MULTI-HOP PATHS]\n"
            f"{relations_text or 'No direct relation paths'}\n\n"
            f"[HIGH-LEVEL THEMATIC TOPICS]\n"
            f"{topics_text or 'General course context'}\n\n"
            "Provide a comprehensive, logically structured answer linking fundamental concepts to overarching principles."
        )

        answer = await self._call_llm(prompt, system_prompt)
        
        return {
            "query": query,
            "answer": answer,
            "low_level_facts": context_bundle["low_level_entities"] + context_bundle["relations"],
            "high_level_topics": context_bundle["high_level_topics"],
            "used_model": self.model
        }

lightrag_engine = LightRAGEngine()
