import asyncio
import httpx
import json
import re
import uuid
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings
from backend.app.services import retrieval

# Extraction window. Large enough to hold a full section of argument, small enough
# that a free-tier model returns complete JSON without truncating.
CHUNK_CHARS = 6000
# Overlap so a concept introduced at a boundary still has its context in one chunk.
CHUNK_OVERLAP = 400
# Ceiling on LLM calls per upload, so one enormous file cannot run up the bill.
MAX_CHUNKS = 12
MAX_CONCURRENT_CHUNKS = 3
MAX_FLASHCARDS = 20

class LightRAGEngine:
    def __init__(self):
        self.api_url = f"{settings.nine_router_base_url}/chat/completions"
        self.api_key = settings.nine_router_api_key
        self.model = settings.default_model

    async def _call_llm(self, prompt: str, system_prompt: str = "") -> Optional[str]:
        """Return the model's text, or None when the provider is unreachable.

        It must never invent a result: this method serves both extraction and
        question answering, so a fabricated payload once surfaced as a blob of
        made-up JSON entities in place of a student's answer.
        """
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

        return None

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
            "title": "Integrated Course Material",
            "summary": "Structured analysis of key concepts and their relations.",
            "key_entities": top_words[:5]
        }]

        return json.dumps({
            "entities": entities,
            "relations": relations,
            "topics": topics,
            "tasks": []
        })

    def _chunk(self, text: str) -> List[str]:
        """Split a document into overlapping windows on paragraph boundaries.

        One call over the first 7500 characters meant a 40-page textbook was
        indexed by its first chapter only, and everything after it was invisible
        to both the graph and the flashcards.
        """
        text = text.strip()
        if not text:
            return []
        if len(text) <= CHUNK_CHARS:
            return [text]

        chunks: List[str] = []
        position = 0
        while position < len(text) and len(chunks) < MAX_CHUNKS:
            window = text[position : position + CHUNK_CHARS]
            at_end = position + CHUNK_CHARS >= len(text)

            # Prefer to cut at a paragraph break, then a sentence, so an entity
            # description is not sliced in half.
            if not at_end:
                for marker in ("\n\n", ". ", "\n"):
                    cut = window.rfind(marker)
                    if cut > CHUNK_CHARS // 2:
                        window = window[: cut + len(marker)]
                        break

            window = window.strip()
            if window:
                chunks.append(window)
            if at_end:
                break

            # Always move forward by more than the overlap, or a short trimmed
            # window would advance a single character and crawl to the cap.
            advance = max(len(window) - CHUNK_OVERLAP, CHUNK_CHARS // 2)
            position += advance

        return chunks

    async def _extract_chunk(self, chunk: str, document_title: str, index: int, total: int) -> Optional[Dict[str, Any]]:
        system_prompt = (
            "You are an academic LightRAG knowledge extractor. "
            "Extract structured knowledge in strictly valid JSON format only, with no markdown code blocks or additional text. "
            "JSON structure: {\n"
            '  "summary": "comprehensive 2-3 sentence overview",\n'
            '  "entities": [{"name": "Name", "type": "Concept/Algorithm/Architecture/Formula", "description": "precise explanation"}],\n'
            '  "relations": [{"source": "Name1", "target": "Name2", "relation": "implements/optimizes/requires/causes", "description": "how they connect"}],\n'
            '  "topics": [{"title": "High Level Theme", "summary": "Abstract topic overview", "key_entities": ["Name1", "Name2"]}],\n'
            '  "tasks": [{"title": "Task title", "course": "Course name", "task_type": "Assignment/Lab/Quiz/Report", "deadline_days": 5, "priority": "high/medium/low", "notes": "details"}],\n'
            '  "flashcards": [{"question": "Conceptual active recall question?", "answer": "Concise factual answer.", "card_type": "concept"}]\n'
            "}"
        )

        part = f" (part {index + 1} of {total})" if total > 1 else ""
        prompt = (
            f"Document Title: {document_title}{part}\n\n"
            f"Document Content:\n{chunk}\n\n"
            "Extract low-level entities, multi-hop relations, high-level abstract topics, "
            "any academic deadlines or tasks mentioned, and 2-4 high-yield active recall flashcards. "
            "Only use facts present in this text."
        )

        raw = await self._call_llm(prompt, system_prompt)
        if not raw:
            return None

        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except Exception:
            return None

    @staticmethod
    def _merge_extractions(parts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fold per-chunk results into one graph.

        Entities and relations reuse the same merge the retrieval layer uses, so a
        concept discussed in three chunks becomes one node rather than three.
        """
        entities: List[Dict[str, Any]] = []
        relations: List[Dict[str, Any]] = []
        topics: Dict[str, Dict[str, Any]] = {}
        tasks: Dict[str, Dict[str, Any]] = {}
        flashcards: Dict[str, Dict[str, Any]] = {}
        summaries: List[str] = []

        for part in parts:
            for e in part.get("entities", []):
                if e.get("name"):
                    entities.append({
                        "name": e["name"],
                        "entity_type": e.get("type") or e.get("entity_type") or "Concept",
                        "description": e.get("description", ""),
                    })
            for r in part.get("relations", []):
                if r.get("source") and r.get("target"):
                    relations.append({
                        "source_name": r["source"],
                        "target_name": r["target"],
                        "relation_type": r.get("relation", "relates_to"),
                        "description": r.get("description", ""),
                        "weight": float(r.get("weight", 1.0)),
                    })
            for t in part.get("topics", []):
                if t.get("title"):
                    topics.setdefault(retrieval.normalize_name(t["title"]), t)
            for t in part.get("tasks", []):
                if t.get("title"):
                    tasks.setdefault(retrieval.normalize_name(t["title"]), t)
            for c in part.get("flashcards", []):
                if c.get("question") and c.get("answer"):
                    flashcards.setdefault(retrieval.normalize_name(c["question"]), c)
            if part.get("summary"):
                summaries.append(part["summary"].strip())

        merged_entities = retrieval.merge_entities(entities)
        canonical = {retrieval.normalize_name(e["name"]): e["name"] for e in merged_entities}
        merged_relations = retrieval.merge_relations(relations, canonical)

        return {
            "summary": " ".join(summaries[:3]),
            "entities": [
                {"name": e["name"], "type": e["entity_type"], "description": e["description"]}
                for e in merged_entities
            ],
            "relations": [
                {
                    "source": r["source_name"],
                    "target": r["target_name"],
                    "relation": r["relation_type"],
                    "description": r["description"],
                    "weight": r["weight"],
                }
                for r in merged_relations
            ],
            "topics": list(topics.values()),
            "tasks": list(tasks.values()),
            "flashcards": list(flashcards.values())[:MAX_FLASHCARDS],
        }

    async def extract_graph_and_topics(self, document_text: str, document_title: str) -> Dict[str, Any]:
        chunks = self._chunk(document_text)
        if not chunks:
            return {"summary": "", "entities": [], "relations": [], "topics": [], "tasks": [], "flashcards": []}

        # Bounded concurrency: a free-tier provider rate-limits, and a 4 GB VPS
        # should not hold a dozen responses in memory at once.
        gate = asyncio.Semaphore(MAX_CONCURRENT_CHUNKS)

        async def run(index: int, chunk: str):
            async with gate:
                return await self._extract_chunk(chunk, document_title, index, len(chunks))

        results = await asyncio.gather(*(run(i, c) for i, c in enumerate(chunks)))
        parts = [r for r in results if r]

        if parts:
            merged = self._merge_extractions(parts)
            if merged["entities"]:
                return merged

        # Every chunk failed: the provider is down. Fall back on the first window
        # only, and say so in the summary rather than pretending it was a full pass.
        fallback = json.loads(self._heuristic_fallback_extraction(chunks[0]))
        fallback["summary"] = f"Offline extraction of {document_title}. The language model was unreachable."
        fallback["flashcards"] = [
            {
                "question": f"What is {e['name']}, and what role does it play?",
                "answer": e["description"],
                "card_type": "concept",
            }
            for e in fallback.get("entities", [])[:4]
        ]
        return fallback

    async def answer_rag_query(
        self,
        query: str,
        entities: List[Dict[str, Any]],
        relations: List[Dict[str, Any]],
        topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        context_bundle = retrieval.retrieve(query, entities, relations, topics)
        
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

        if answer is None:
            # Say so plainly. The retrieved graph context is still real and worth
            # showing; only the model's prose is missing.
            matched = ", ".join(e["name"] for e in context_bundle["low_level_entities"][:5])
            answer = (
                "The language model is unreachable, so I cannot write an explanation "
                "right now. Retrieval still ran against your material"
                + (f" and matched: {matched}." if matched else ", but nothing matched this question.")
            )

        return {
            "query": query,
            "answer": answer,
            "low_level_facts": context_bundle["low_level_entities"] + context_bundle["relations"],
            "high_level_topics": context_bundle["high_level_topics"],
            "used_model": self.model
        }

lightrag_engine = LightRAGEngine()
