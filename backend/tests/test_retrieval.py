"""Checks for dual-level retrieval and cross-document entity merging.

Run: PYTHONPATH=. python backend/tests/test_retrieval.py

The behaviours locked here are the two the old code got wrong: it matched only on
literal substrings, and it treated the same concept in two documents as two
unrelated nodes.
"""

from backend.app.services.retrieval import (
    BM25,
    merge_entities,
    merge_relations,
    normalize_name,
    retrieve,
    tokenize,
)

ENTITIES = [
    {"id": "e1", "name": "AVL Tree Rotation", "entity_type": "Algorithm",
     "description": "Rebalances a binary search tree by rewiring local pointers.", "doc_id": "d1"},
    {"id": "e2", "name": "Red-Black Tree", "entity_type": "Algorithm",
     "description": "A balanced search tree using node colouring.", "doc_id": "d1"},
    {"id": "e3", "name": "Deadlock", "entity_type": "Concept",
     "description": "Processes block forever waiting on each other.", "doc_id": "d1"},
    # Same concept, different document, different casing and wording.
    {"id": "e4", "name": "deadlock", "entity_type": "Concept",
     "description": "A cycle of processes each holding a resource the next one needs.", "doc_id": "d2"},
    {"id": "e5", "name": "Semaphore", "entity_type": "Concept",
     "description": "A counter guarding access to a shared resource.", "doc_id": "d2"},
]

RELATIONS = [
    {"id": "r1", "source_name": "AVL Tree Rotation", "target_name": "Red-Black Tree",
     "relation_type": "compared_with", "description": "Both keep height balanced.", "weight": 1.0},
    {"id": "r2", "source_name": "Deadlock", "target_name": "Semaphore",
     "relation_type": "prevented_by", "description": "Careful ordering avoids cycles.", "weight": 1.0},
    {"id": "r3", "source_name": "deadlock", "target_name": "Semaphore",
     "relation_type": "prevented_by", "description": "Same edge, other document.", "weight": 1.0},
]

TOPICS = [
    {"id": "t1", "title": "Balanced Search Trees",
     "summary": "How AVL and red-black trees keep lookups logarithmic."},
    {"id": "t2", "title": "Process Synchronisation",
     "summary": "Coordinating concurrent processes without deadlock."},
]


def test_tokenize_drops_stopwords():
    assert tokenize("What is the AVL Tree?") == ["avl", "tree"]
    assert tokenize("Apa itu deadlock pada sistem operasi") == ["deadlock", "sistem", "operasi"]


def test_normalize_name_merges_surface_forms():
    assert normalize_name("Deadlock") == normalize_name("deadlock")
    assert normalize_name("AVL  Tree") == normalize_name("avl tree")


def test_bm25_ranks_relevant_document_first():
    bm25 = BM25([
        "AVL tree rotation rebalances a binary search tree",
        "Semaphores guard a shared resource",
        "Deadlock blocks processes forever",
    ])
    top = bm25.top("how does avl rotation work", limit=3)
    assert top, "expected at least one hit"
    assert top[0][0] == 0, "the AVL document should rank first"


def test_matches_without_literal_substring():
    """The old code required the entity name to appear verbatim in the query."""
    query = "how does rebalancing work in AVL"
    assert "AVL Tree Rotation" not in query, "precondition: no verbatim entity name"

    result = retrieve(query, ENTITIES, RELATIONS, TOPICS)
    names = [e["name"] for e in result["low_level_entities"]]
    assert "AVL Tree Rotation" in names, f"substring-free query retrieved {names}"


def test_merges_same_entity_across_documents():
    merged = merge_entities(ENTITIES)
    names = [e["name"] for e in merged]
    assert len(merged) == 4, f"expected 4 distinct concepts, got {len(merged)}: {names}"

    deadlock = next(e for e in merged if normalize_name(e["name"]) == "deadlock")
    assert set(deadlock["doc_ids"]) == {"d1", "d2"}, "merged node must cite both documents"
    # The longer description wins, so detail is not lost in the merge.
    assert "cycle of processes" in deadlock["description"]


def test_merged_relations_drop_duplicate_edges():
    merged = merge_entities(ENTITIES)
    canonical = {normalize_name(e["name"]): e["name"] for e in merged}
    relations = merge_relations(RELATIONS, canonical)

    prevented = [r for r in relations if r["relation_type"] == "prevented_by"]
    assert len(prevented) == 1, f"duplicate edge across documents not merged: {prevented}"
    assert prevented[0]["weight"] == 2.0, "repeated evidence should raise the weight"


def test_expands_to_graph_neighbours():
    result = retrieve("deadlock", ENTITIES, RELATIONS, TOPICS)
    matched = [e["name"] for e in result["low_level_entities"]]
    assert any(normalize_name(n) == "deadlock" for n in matched)
    assert "Semaphore" in result["connected_neighbors"], "one-hop neighbour was not pulled in"


def test_selects_high_level_topic():
    result = retrieve("compare the two balanced tree structures", ENTITIES, RELATIONS, TOPICS)
    titles = [t["title"] for t in result["high_level_topics"]]
    assert titles[0] == "Balanced Search Trees", f"wrong topic ranked first: {titles}"


def test_reports_merge_effect():
    result = retrieve("deadlock", ENTITIES, RELATIONS, TOPICS)
    assert result["raw_entity_count"] == 5
    assert result["merged_entity_count"] == 4


def test_empty_corpus_does_not_crash():
    result = retrieve("anything", [], [], [])
    assert result["low_level_entities"] == []
    assert result["relations"] == []
    assert result["high_level_topics"] == []


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("\nall retrieval checks passed")
