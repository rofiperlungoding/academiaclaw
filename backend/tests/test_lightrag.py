from backend.app.services.lightrag_engine import lightrag_engine

def test_graph_building_and_traversal():
    entities = [
        {"name": "Cache Memory", "entity_type": "Hardware", "description": "High speed volatile memory"},
        {"name": "L1 Cache", "entity_type": "Component", "description": "Fastest onboard core cache"},
        {"name": "CPU Pipeline", "entity_type": "Architecture", "description": "Instruction execution pipeline"},
        {"name": "Branch Predictor", "entity_type": "Unit", "description": "Speculative execution unit"}
    ]
    
    relations = [
        {"source_name": "L1 Cache", "target_name": "Cache Memory", "relation_type": "is_a", "description": "L1 is tier 1 cache"},
        {"source_name": "CPU Pipeline", "target_name": "L1 Cache", "relation_type": "accesses", "description": "Pipeline loads instructions from L1"},
        {"source_name": "CPU Pipeline", "target_name": "Branch Predictor", "relation_type": "uses", "description": "Pipeline relies on branch predictor"}
    ]
    
    topics = [
        {"title": "Computer Architecture & Memory Hierarchy", "summary": "Comprehensive overview of CPU caching and pipeline optimization.", "key_entities": ["Cache Memory", "L1 Cache", "CPU Pipeline"]}
    ]

    context = lightrag_engine.retrieve_dual_level_context("How does CPU Pipeline interact with cache?", entities, relations, topics)
    
    low_level = [e["name"] for e in context["low_level_entities"]]
    assert "CPU Pipeline" in low_level or "Cache Memory" in low_level or "L1 Cache" in low_level
    assert len(context["high_level_topics"]) > 0
    assert len(context["relations"]) > 0

if __name__ == "__main__":
    test_graph_building_and_traversal()
    print("All LightRAG Graph tests passed successfully!")
