from langchain_core.documents import Document

from src.rag import answer_question, classify_intent, contextualize_question
from tests.conftest import FakeHybridIndex, FakeLLM


def test_classify_intent_smalltalk():
    llm = FakeLLM(default="SMALLTALK")
    assert classify_intent("hi there!", llm=llm) == "SMALLTALK"


def test_classify_intent_off_topic():
    llm = FakeLLM(default="OFF_TOPIC")
    assert classify_intent("write me a python quicksort", llm=llm) == "OFF_TOPIC"


def test_classify_intent_ramayana():
    llm = FakeLLM(default="RAMAYANA")
    assert classify_intent("Who is Hanuman?", llm=llm) == "RAMAYANA"


def test_classify_intent_defaults_to_ramayana_on_unparseable_response():
    llm = FakeLLM(default="I'm not sure, could you clarify?")
    assert classify_intent("Who is Hanuman?", llm=llm) == "RAMAYANA"


def test_answer_question_smalltalk_skips_retrieval_and_returns_no_sources():
    llm = FakeLLM(script={
        "Classify the user's message": "SMALLTALK",
        "Reply briefly and naturally": "Namaste! Ask me anything about Rama's story.",
    })
    hybrid_index = FakeHybridIndex()

    import src.rag as rag_mod
    rag_mod._make_llm = lambda: llm

    answer, sources, meta = answer_question("hello!", hybrid_index, history=[])

    assert answer == "Namaste! Ask me anything about Rama's story."
    assert sources == []
    assert meta == {"intent": "smalltalk", "tokens": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}}
    assert hybrid_index.queries_seen == []  # no retrieval was performed


def test_answer_question_blocks_flagged_content_before_any_llm_call(monkeypatch):
    monkeypatch.setattr("src.rag.is_flagged", lambda question: True)
    llm = FakeLLM(default="should never be reached")
    hybrid_index = FakeHybridIndex()

    import src.rag as rag_mod
    rag_mod._make_llm = lambda: llm

    answer, sources, meta = answer_question("abusive message", hybrid_index, history=[])

    assert "can't engage" in answer
    assert sources == []
    assert meta == {"intent": "blocked"}
    assert hybrid_index.queries_seen == []
    assert llm.calls == []  # moderation short-circuits before the classifier or anything else


def test_answer_question_off_topic_returns_canned_redirect_without_llm_answer_call():
    llm = FakeLLM(default="SMALLTALK")  # would be wrong if this leaked through
    llm.script = {"Classify the user's message": "OFF_TOPIC"}
    hybrid_index = FakeHybridIndex()

    import src.rag as rag_mod
    rag_mod._make_llm = lambda: llm

    answer, sources, meta = answer_question("write me a sorting algorithm", hybrid_index, history=[])

    assert "Valmiki Ramayana" in answer
    assert sources == []
    assert meta == {"intent": "off_topic"}
    assert hybrid_index.queries_seen == []
    assert len(llm.calls) == 1  # only the classifier ran, no wasted answer-generation call


def test_contextualize_question_noop_without_history():
    llm = FakeLLM()
    result = contextualize_question("Who is Hanuman?", [], llm=llm)
    assert result == "Who is Hanuman?"
    assert llm.calls == []  # no LLM call needed for a standalone first question


def test_contextualize_question_rewrites_followup_with_history():
    llm = FakeLLM(default="Who is Hanuman's brother?")
    history = [
        {"role": "user", "content": "Who is Hanuman?"},
        {"role": "assistant", "content": "Hanuman is a vanara devoted to Rama."},
    ]
    result = contextualize_question("What about his brother?", history, llm=llm)
    assert result == "Who is Hanuman's brother?"
    assert len(llm.calls) == 1
    assert "What about his brother?" in llm.calls[0]
    assert "Who is Hanuman?" in llm.calls[0]  # history was included in the prompt


def test_contextualize_question_falls_back_to_original_on_empty_response():
    llm = FakeLLM(default="")
    history = [{"role": "user", "content": "Who is Hanuman?"}]
    result = contextualize_question("And then?", history, llm=llm)
    assert result == "And then?"


def test_answer_question_returns_answer_and_deduped_sorted_sources():
    docs = [
        (
            Document(page_content="Chunk A", metadata={"source_file": "a.pdf", "page": 0}),
            0.4,
        ),
        (
            Document(page_content="Chunk B", metadata={"source_file": "a.pdf", "page": 0}),
            0.9,  # same (file, page) as above but higher relevance — should win the dedup
        ),
        (
            Document(page_content="Chunk C", metadata={"source_file": "b.pdf", "page": 2}),
            0.6,
        ),
    ]
    hybrid_index = FakeHybridIndex(scored_docs=docs)
    llm = FakeLLM(default="Grounded answer.")

    import src.rag as rag_mod
    rag_mod._make_llm = lambda: llm

    answer, sources, meta = answer_question("Any question", hybrid_index, history=[])

    assert answer == "Grounded answer."
    assert len(sources) == 2  # deduped by (source_file, page)
    assert sources[0]["source_file"] == "a.pdf"
    assert sources[0]["relevance"] == 0.9  # kept the higher-relevance duplicate
    assert sources[0]["page"] == 1  # 0-indexed page 0 shown as page 1
    assert sources[1]["source_file"] == "b.pdf"

    assert meta["chunk_count"] == 3
    assert meta["top_relevance"] == 0.9
    assert meta["search_query"] == "Any question"


def test_answer_question_handles_no_retrieved_context():
    hybrid_index = FakeHybridIndex(scored_docs=[])
    llm = FakeLLM(default="I could not find this in the indexed text.")

    import src.rag as rag_mod
    rag_mod._make_llm = lambda: llm

    answer, sources, meta = answer_question("Unrelated question", hybrid_index, history=[])
    assert sources == []
    assert meta["chunk_count"] == 0
    assert meta["top_relevance"] == 0.0
    assert "No relevant context" in llm.calls[-1]  # calls[0] is now the intent classifier


def test_is_cosmology_question_matches_multiverse_and_loka_terms():
    from src.rag import is_cosmology_question
    assert is_cosmology_question("Does the Ramayana describe a multiverse?")
    assert is_cosmology_question("What are the three worlds?")
    assert is_cosmology_question("Tell me about Patala")
    assert not is_cosmology_question("Who is Hanuman?")


def test_cosmology_question_expands_search_and_adds_guidance():
    llm = FakeLLM(script={
        "Classify the user's message": "RAMAYANA",
    }, default="A grounded answer.")
    hybrid_index = FakeHybridIndex()

    import src.rag as rag_mod
    rag_mod._make_llm = lambda: llm

    answer, sources, meta = answer_question("Is there a multiverse in the Ramayana?", hybrid_index, history=[])

    assert meta["cosmology"] is True
    assert "Svarga" in hybrid_index.queries_seen[0] and "loka" in hybrid_index.queries_seen[0]
    assert any("worlds / cosmology" in c for c in llm.calls)


def test_ordinary_question_is_not_flagged_cosmology():
    llm = FakeLLM(script={"Classify the user's message": "RAMAYANA"}, default="ok")
    hybrid_index = FakeHybridIndex()

    import src.rag as rag_mod
    rag_mod._make_llm = lambda: llm

    _, _, meta = answer_question("Who is Hanuman?", hybrid_index, history=[])
    assert "cosmology" not in meta
    assert hybrid_index.queries_seen[0] == "Who is Hanuman?"
