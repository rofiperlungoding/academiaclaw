"""Dual-level retrieval over the knowledge graph.

Replaces substring matching. The old check was `if entity_name in query`, so
asking about "AVL" never reached an entity called "AVL Tree Rotation" unless the
query repeated the name exactly, and a query that shared no literal substring
retrieved nothing at all.

Two levels, as in the LightRAG design:

* **Low level** — specific entities and the relation triples around them, ranked
  by BM25 over name plus description, then expanded one hop through the graph so
  neighbours of a strong match come along.
* **High level** — thematic topics, ranked by BM25 over title plus summary, which
  is what answers "compare chapter 2 and chapter 5" where no single entity matches.

Ranking is lexical (BM25), not embeddings: a 4 GB VPS has no embedding model
loaded, and an extra network round-trip per question would cost more than it buys
at this corpus size. The scoring is honest about what it is.
"""

import math
import re
from collections import Counter
from typing import Any, Dict, Iterable, List, Sequence, Tuple

import networkx as nx

# BM25 term-frequency saturation and length normalisation. Standard defaults.
K1 = 1.5
B = 0.75

# Short function words carry no retrieval signal and would otherwise dominate the
# short texts (entity names are often 2-3 words).
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "how",
    "in", "is", "it", "its", "of", "on", "or", "that", "the", "this", "to", "was",
    "what", "when", "where", "which", "who", "why", "with",
    # Indonesian, since a student may ask in either language.
    "apa", "atau", "yang", "untuk", "dari", "dan", "di", "ke", "pada", "dengan",
    "adalah", "itu", "ini", "bagaimana", "mengapa", "kapan", "siapa",
}

_TOKEN = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> List[str]:
    tokens = _TOKEN.findall((text or "").lower())
    return [t for t in tokens if len(t) > 1 and t not in STOPWORDS]


def normalize_name(name: str) -> str:
    """Canonical key for an entity name, used to merge duplicates across documents.

    Two chapters that both discuss "Deadlock" produce two rows, because entities
    are extracted per document. Without a shared key the graph shows them as
    separate nodes and never connects the chapters.
    """
    return " ".join(tokenize(name)) or (name or "").strip().lower()


class BM25:
    """Okapi BM25 over a small in-memory corpus."""

    def __init__(self, documents: Sequence[str]):
        self.docs: List[List[str]] = [tokenize(d) for d in documents]
        self.lengths = [len(d) for d in self.docs]
        self.avg_length = (sum(self.lengths) / len(self.lengths)) if self.docs else 0.0
        self.freqs = [Counter(d) for d in self.docs]

        df: Counter = Counter()
        for doc in self.docs:
            df.update(set(doc))

        n = len(self.docs)
        self.idf = {
            term: math.log(1 + (n - count + 0.5) / (count + 0.5))
            for term, count in df.items()
        }

    def scores(self, query: str) -> List[float]:
        terms = tokenize(query)
        if not terms or not self.docs:
            return [0.0] * len(self.docs)

        out = []
        for freq, length in zip(self.freqs, self.lengths):
            score = 0.0
            for term in terms:
                tf = freq.get(term, 0)
                if not tf:
                    continue
                norm = 1 - B + B * (length / self.avg_length if self.avg_length else 1)
                score += self.idf.get(term, 0.0) * (tf * (K1 + 1)) / (tf + K1 * norm)
            out.append(score)
        return out

    def top(self, query: str, limit: int) -> List[Tuple[int, float]]:
        ranked = [(i, s) for i, s in enumerate(self.scores(query)) if s > 0]
        ranked.sort(key=lambda pair: pair[1], reverse=True)
        return ranked[:limit]


def merge_entities(entities: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Collapse entities that name the same concept in different documents.

    Keeps the longest description seen, since the extractor's wording varies per
    document, and records every source document on the merged node.
    """
    merged: Dict[str, Dict[str, Any]] = {}

    for ent in entities:
        name = (ent.get("name") or "").strip()
        if not name:
            continue
        key = normalize_name(name)
        description = ent.get("description") or ""
        doc_id = ent.get("doc_id")

        existing = merged.get(key)
        if existing is None:
            merged[key] = {
                "id": ent.get("id"),
                "name": name,
                "entity_type": ent.get("entity_type") or ent.get("type") or "Concept",
                "description": description,
                "doc_ids": [doc_id] if doc_id else [],
            }
            continue

        if len(description) > len(existing["description"]):
            existing["description"] = description
        # Prefer the more specific surface form ("AVL Tree" over "avl").
        if len(name) > len(existing["name"]):
            existing["name"] = name
        if doc_id and doc_id not in existing["doc_ids"]:
            existing["doc_ids"].append(doc_id)

    return list(merged.values())


def merge_relations(
    relations: Iterable[Dict[str, Any]], canonical: Dict[str, str]
) -> List[Dict[str, Any]]:
    """Remap relation endpoints onto merged entity names and drop duplicate edges."""
    seen: Dict[Tuple[str, str, str], Dict[str, Any]] = {}

    for rel in relations:
        source = canonical.get(normalize_name(rel.get("source_name", "")))
        target = canonical.get(normalize_name(rel.get("target_name", "")))
        if not source or not target or source == target:
            continue

        relation_type = rel.get("relation_type") or "relates_to"
        key = (source, target, relation_type)
        if key in seen:
            # Repeated across documents means the link is better attested.
            seen[key]["weight"] += float(rel.get("weight", 1.0))
            continue

        seen[key] = {
            "id": rel.get("id"),
            "source_name": source,
            "target_name": target,
            "relation_type": relation_type,
            "description": rel.get("description", ""),
            "weight": float(rel.get("weight", 1.0)),
        }

    return list(seen.values())


def build_graph(entities: Sequence[Dict[str, Any]], relations: Sequence[Dict[str, Any]]) -> nx.DiGraph:
    graph = nx.DiGraph()
    for ent in entities:
        graph.add_node(ent["name"], **{k: v for k, v in ent.items() if k != "name"})
    for rel in relations:
        graph.add_edge(
            rel["source_name"],
            rel["target_name"],
            relation=rel.get("relation_type", "relates_to"),
            description=rel.get("description", ""),
            weight=rel.get("weight", 1.0),
        )
    return graph


def retrieve(
    query: str,
    entities: Sequence[Dict[str, Any]],
    relations: Sequence[Dict[str, Any]],
    topics: Sequence[Dict[str, Any]],
    entity_limit: int = 8,
    neighbour_limit: int = 8,
    relation_limit: int = 15,
    topic_limit: int = 4,
) -> Dict[str, Any]:
    """Rank entities, their graph neighbourhood, and topics against the query."""
    merged_entities = merge_entities(entities)
    canonical = {normalize_name(e["name"]): e["name"] for e in merged_entities}
    merged_relations = merge_relations(relations, canonical)

    entity_hits = BM25(
        [f"{e['name']} {e['name']} {e.get('description', '')}" for e in merged_entities]
    ).top(query, entity_limit)
    matched = [merged_entities[i] for i, _ in entity_hits]
    matched_names = {e["name"] for e in matched}

    # Expand one hop: a question about a concept is usually answered by what the
    # concept connects to, not the concept's own definition alone.
    graph = build_graph(merged_entities, merged_relations)
    neighbours: Counter = Counter()
    for name in matched_names:
        if not graph.has_node(name):
            continue
        for other in list(graph.successors(name)) + list(graph.predecessors(name)):
            if other in matched_names:
                continue
            edge = graph.get_edge_data(name, other) or graph.get_edge_data(other, name) or {}
            neighbours[other] += float(edge.get("weight", 1.0))

    neighbour_names = [n for n, _ in neighbours.most_common(neighbour_limit)]
    in_scope = matched_names | set(neighbour_names)

    relevant_relations = sorted(
        (
            r for r in merged_relations
            if r["source_name"] in in_scope and r["target_name"] in in_scope
        ),
        key=lambda r: (
            r["source_name"] in matched_names and r["target_name"] in matched_names,
            r["weight"],
        ),
        reverse=True,
    )[:relation_limit]

    topic_hits = BM25(
        [f"{t.get('title', '')} {t.get('summary', '')}" for t in topics]
    ).top(query, topic_limit)
    relevant_topics = [topics[i] for i, _ in topic_hits]
    if not relevant_topics and topics:
        # A thematic question may share no vocabulary with any topic summary;
        # a couple of topics still beat no high-level context at all.
        relevant_topics = list(topics[:2])

    return {
        "low_level_entities": matched,
        "connected_neighbors": neighbour_names,
        "relations": relevant_relations,
        "high_level_topics": relevant_topics,
        "merged_entity_count": len(merged_entities),
        "raw_entity_count": len(list(entities)),
    }
