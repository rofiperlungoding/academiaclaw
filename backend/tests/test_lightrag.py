"""Retrieval over a realistic architecture graph, through the public entry point."""

from backend.app.services import retrieval

ENTITIES = [
    {"id": "e1", "name": "Cache Memory", "entity_type": "Hardware",
     "description": "High speed volatile memory close to the processor.", "doc_id": "d1"},
    {"id": "e2", "name": "L1 Cache", "entity_type": "Component",
     "description": "The fastest on-core cache tier.", "doc_id": "d1"},
    {"id": "e3", "name": "CPU Pipeline", "entity_type": "Architecture",
     "description": "Stages that overlap instruction execution.", "doc_id": "d1"},
    {"id": "e4", "name": "Branch Predictor", "entity_type": "Unit",
     "description": "Speculates which way a branch will go.", "doc_id": "d1"},
]

RELATIONS = [
    {"id": "r1", "source_name": "L1 Cache", "target_name": "Cache Memory",
     "relation_type": "is_a", "description": "L1 is the first cache tier.", "weight": 1.0},
    {"id": "r2", "source_name": "CPU Pipeline", "target_name": "L1 Cache",
     "relation_type": "accesses", "description": "The pipeline loads instructions from L1.", "weight": 1.0},
    {"id": "r3", "source_name": "CPU Pipeline", "target_name": "Branch Predictor",
     "relation_type": "uses", "description": "The pipeline relies on the branch predictor.", "weight": 1.0},
]

TOPICS = [
    {"id": "t1", "title": "Computer Architecture and Memory Hierarchy",
     "summary": "How CPU caching and pipeline optimisation interact.",
     "key_entities": ["Cache Memory", "L1 Cache", "CPU Pipeline"]},
]


def test_retrieves_entities_relations_and_topic():
    context = retrieval.retrieve(
        "How does the CPU pipeline interact with cache?", ENTITIES, RELATIONS, TOPICS
    )

    names = [e["name"] for e in context["low_level_entities"]]
    assert "CPU Pipeline" in names, f"pipeline not retrieved: {names}"
    assert context["high_level_topics"], "no high-level topic selected"
    assert context["relations"], "no relation triples returned"


def test_pulls_in_neighbour_not_named_in_query():
    """Branch Predictor is never mentioned, but it hangs off the matched entity."""
    context = retrieval.retrieve("explain the CPU pipeline", ENTITIES, RELATIONS, TOPICS)
    reachable = {e["name"] for e in context["low_level_entities"]} | set(
        context["connected_neighbors"]
    )
    assert "Branch Predictor" in reachable, f"one-hop expansion missed it: {reachable}"


def test_unrelated_query_returns_no_entities():
    context = retrieval.retrieve("photosynthesis in plants", ENTITIES, RELATIONS, TOPICS)
    assert context["low_level_entities"] == [], "unrelated query should match nothing"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("\nall LightRAG retrieval checks passed")
