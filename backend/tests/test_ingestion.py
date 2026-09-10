from langchain_core.documents import Document

from src.ingestion import chunk_documents, ingest_pdfs_into_vectorstore, load_pdfs


def test_chunk_documents_splits_long_text_with_overlap():
    long_text = "Rama went to the forest. " * 100  # well over one chunk
    docs = [Document(page_content=long_text, metadata={"source_file": "test.pdf", "page": 0})]

    chunks = chunk_documents(docs, chunk_size=200, chunk_overlap=50)

    assert len(chunks) > 1
    for c in chunks:
        assert len(c.page_content) <= 200 + 1  # splitter can land slightly over at a separator boundary
        assert c.metadata["source_file"] == "test.pdf"


def test_chunk_documents_keeps_short_text_as_single_chunk():
    docs = [Document(page_content="Short passage.", metadata={"source_file": "test.pdf", "page": 0})]
    chunks = chunk_documents(docs, chunk_size=800, chunk_overlap=200)
    assert len(chunks) == 1
    assert chunks[0].page_content == "Short passage."


def test_load_pdfs_tags_source_file_from_basename(monkeypatch, tmp_path):
    fake_pages = [
        Document(page_content="Page one text.", metadata={"page": 0}),
        Document(page_content="Page two text.", metadata={"page": 1}),
    ]

    class FakeLoader:
        def __init__(self, path):
            self.path = path

        def load(self):
            return fake_pages

    monkeypatch.setattr("src.ingestion.PyPDFLoader", FakeLoader)

    pdf_path = tmp_path / "ramayana.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 fake")

    docs = load_pdfs([str(pdf_path)])

    assert len(docs) == 2
    assert all(d.metadata["source_file"] == "ramayana.pdf" for d in docs)


class FakeVectorstore:
    def __init__(self, max_batch_size=None):
        self.added = []
        self.add_documents_calls = []
        self.max_batch_size = max_batch_size

    def add_documents(self, chunks):
        if self.max_batch_size is not None and len(chunks) > self.max_batch_size:
            raise ValueError(f"Batch size of {len(chunks)} is greater than max batch size of {self.max_batch_size}")
        self.add_documents_calls.append(len(chunks))
        self.added.extend(chunks)


def test_ingest_pdfs_into_vectorstore_returns_page_and_chunk_counts(monkeypatch, tmp_path):
    fake_pages = [Document(page_content="Some content. " * 60, metadata={"page": 0})]

    class FakeLoader:
        def __init__(self, path):
            pass

        def load(self):
            return fake_pages

    monkeypatch.setattr("src.ingestion.PyPDFLoader", FakeLoader)

    pdf_path = tmp_path / "ramayana.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 fake")

    vs = FakeVectorstore()
    doc_count, chunk_count = ingest_pdfs_into_vectorstore([str(pdf_path)], vs)

    assert doc_count == 1
    assert chunk_count >= 1
    assert len(vs.added) == chunk_count


def test_ingest_pdfs_into_vectorstore_batches_large_corpora(monkeypatch, tmp_path):
    # Regression test: a real run against an 11-text, ~30,000-chunk corpus
    # once failed here — add_documents() was called once with every chunk,
    # and Chroma rejects a single call above its configured max batch size.
    fake_pages = [
        Document(page_content=f"Page {i} content here.", metadata={"page": i}) for i in range(50)
    ]

    class FakeLoader:
        def __init__(self, path):
            pass

        def load(self):
            return fake_pages

    monkeypatch.setattr("src.ingestion.PyPDFLoader", FakeLoader)
    # Force many small chunks so total chunk count exceeds a tiny batch_size.
    monkeypatch.setattr("src.ingestion.chunk_documents", lambda docs, **kw: docs * 5)

    pdf_path = tmp_path / "big.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 fake")

    vs = FakeVectorstore(max_batch_size=100)  # 250 chunks total, well over this
    doc_count, chunk_count = ingest_pdfs_into_vectorstore([str(pdf_path)], vs, batch_size=100)

    assert chunk_count == 250
    assert len(vs.added) == 250
    # Split into batches of <= 100, not one call with all 250.
    assert all(n <= 100 for n in vs.add_documents_calls)
    assert len(vs.add_documents_calls) == 3
