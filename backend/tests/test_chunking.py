"""Chunked extraction over a whole document, with a stub model.

Run: PYTHONPATH=. python backend/tests/test_chunking.py

Extraction used to send only `document_text[:7500]` in one call, so a long
document was indexed by its opening section and the rest was invisible to both
the knowledge graph and the generated flashcards.
"""

import asyncio
import json

from backend.app.services import lightrag_engine as engine_module
from backend.app.services.lightrag_engine import CHUNK_CHARS, MAX_CHUNKS, lightrag_engine


def build_document(sections: int) -> str:
    """A document whose every section names a distinct, findable concept."""
    parts = []
    for i in range(sections):
        filler = f"Discussion of section {i} continues with supporting detail. " * 90
        parts.append(f"Section {i}\n\nConceptZ{i} is defined here.\n\n{filler}")
    return "\n\n".join(parts)


def stub_llm(monkey_calls):
    """Replace the network call with a deterministic extractor over the chunk."""

    async def fake(prompt: str, system_prompt: str = ""):
        monkey_calls.append(prompt)
        body = prompt.split("Document Content:\n", 1)[-1]
        names = sorted({w.strip(".,") for w in body.split() if w.startswith("ConceptZ")})
        return json.dumps({
            "summary": f"Covers {len(names)} concepts.",
            "entities": [
                {"name": n, "type": "Concept", "description": f"Definition of {n}."} for n in names
            ],
            "relations": [
                {"source": names[i], "target": names[i + 1], "relation": "precedes", "description": ""}
                for i in range(len(names) - 1)
            ],
            "topics": [{"title": "Shared Theme", "summary": "One theme across the document."}],
            "tasks": [],
            "flashcards": [
                {"question": f"What is {n}?", "answer": f"Definition of {n}.", "card_type": "concept"}
                for n in names
            ],
        })

    return fake


def run(document: str):
    calls: list = []
    original = lightrag_engine._call_llm
    lightrag_engine._call_llm = stub_llm(calls)
    try:
        result = asyncio.run(lightrag_engine.extract_graph_and_topics(document, "Test Document"))
    finally:
        lightrag_engine._call_llm = original
    return result, calls


def test_short_document_is_one_call():
    result, calls = run("ConceptZ0 is a short standalone note.")
    assert len(calls) == 1, f"expected 1 call, got {len(calls)}"
    assert [e["name"] for e in result["entities"]] == ["ConceptZ0"]


def test_long_document_is_split_into_several_calls():
    document = build_document(5)
    assert len(document) > CHUNK_CHARS * 3, "precondition: document spans several chunks"

    result, calls = run(document)
    assert len(calls) > 1, "a long document must be chunked, not truncated"


def test_concepts_past_the_old_cutoff_are_indexed():
    """The decisive check: content beyond character 7500 must reach the graph."""
    document = build_document(5)
    late = [f"ConceptZ{i}" for i in range(5) if document.index(f"ConceptZ{i} is defined") > 7500]
    assert late, "precondition: some concepts sit past the old truncation point"

    result, _ = run(document)
    found = {e["name"] for e in result["entities"]}
    missing = [n for n in late if n not in found]
    assert not missing, f"content past the old cutoff was dropped: {missing}"


def test_duplicate_concepts_across_chunks_merge():
    # Overlap makes boundary concepts appear in two chunks; they must not double up.
    result, _ = run(build_document(5))
    names = [e["name"] for e in result["entities"]]
    assert len(names) == len(set(names)), f"duplicate entities survived the merge: {names}"


def test_chunk_count_is_capped():
    huge = build_document(60)
    chunks = lightrag_engine._chunk(huge)
    assert len(chunks) <= MAX_CHUNKS, f"{len(chunks)} chunks exceeds the {MAX_CHUNKS} cap"


def test_falls_back_when_every_chunk_fails():
    async def always_fail(prompt: str, system_prompt: str = ""):
        return None

    original = lightrag_engine._call_llm
    lightrag_engine._call_llm = always_fail
    try:
        result = asyncio.run(
            lightrag_engine.extract_graph_and_topics(
                "Deadlock and Semaphore appear in this Text.", "Offline Doc"
            )
        )
    finally:
        lightrag_engine._call_llm = original

    assert "unreachable" in result["summary"], "the fallback must admit the model was down"
    assert result["entities"], "the heuristic fallback should still produce something"


def test_empty_document_returns_empty_result():
    result = asyncio.run(lightrag_engine.extract_graph_and_topics("   ", "Empty"))
    assert result["entities"] == []
    assert result["flashcards"] == []


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("\nall chunking checks passed")
