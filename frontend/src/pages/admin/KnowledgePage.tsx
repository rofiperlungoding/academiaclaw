import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import type { DocumentItem, KnowledgeGraphData } from '../../types';
import { api } from '../../api';
import { GraphVisualizer } from '../../components/GraphVisualizer';
import { useToast } from '../../components/Toast';

export function KnowledgePage() {
  const { success, error } = useToast();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState<string | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const fetchDocs = async () => {
    try {
      setDocs(await api.getDocuments());
    } catch {
      setDocs([]);
    }
  };

  const fetchGraph = async (docId?: string | null) => {
    try {
      setGraphData(await api.getGraph(docId || undefined));
    } catch {
      setGraphData(null);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    fetchGraph(selectedDocId);
  }, [selectedDocId]);

  const processFile = async (file: File) => {
    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      success(`"${doc.title}" indexed.`);
      await fetchDocs();
      await fetchGraph(selectedDocId);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Upload and graph extraction failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document? Its graph entities, topics, and flashcards go too.')) {
      return;
    }
    try {
      await api.deleteDocument(docId);
      success('Document deleted.');
      if (selectedDocId === docId) setSelectedDocId(null);
      await fetchDocs();
      await fetchGraph(selectedDocId === docId ? null : selectedDocId);
    } catch {
      error('Could not delete the document.');
    }
  };

  const askRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    try {
      const res = await api.askRag(ragQuery, selectedDocId ? [selectedDocId] : undefined);
      setRagResult(res.answer);
    } catch {
      setRagResult('Dual-level RAG query failed. Check that the backend is running.');
    } finally {
      setRagLoading(false);
    }
  };

  const selectedDoc = docs.find((d) => d.id === selectedDocId);

  return (
    <div className="animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Knowledge</h1>
          <p className="mt-1 muted max-w-lg">
            Extract entities, relations, macro topics, flashcards, and deadlines from course documents.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.md,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
          }}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary btn-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Extracting…' : 'Upload material'}
        </button>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) processFile(f);
        }}
        className={`mt-6 rounded-xl border border-dashed py-6 text-center text-[13px] transition-colors ${
          isDragOver ? 'border-zinc-400 bg-zinc-50 text-zinc-700' : 'border-zinc-200 text-zinc-400'
        }`}
      >
        Drop a PDF or slide deck here to auto-extract
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Documents ({docs.length})</h2>
            {selectedDocId && (
              <button
                onClick={() => setSelectedDocId(null)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Reset filter
              </button>
            )}
          </div>

          <div className="mt-3 list border-t border-zinc-100 max-h-[420px] overflow-y-auto">
            <button
              onClick={() => setSelectedDocId(null)}
              className={`w-full text-left py-3 text-[13px] ${
                selectedDocId === null ? 'font-medium text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Entire global graph
            </button>

            {docs.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3 py-3 group">
                <button
                  onClick={() => setSelectedDocId(doc.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p
                    className={`text-[13px] truncate ${
                      selectedDocId === doc.id
                        ? 'font-medium text-zinc-900'
                        : 'text-zinc-700 group-hover:text-zinc-900'
                    }`}
                  >
                    {doc.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {doc.entities_count} entities · {doc.relations_count} relations · {doc.topics_count} topics
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="shrink-0 text-zinc-200 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Delete document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {docs.length === 0 && (
              <p className="py-8 text-center text-[13px] text-zinc-400">No documents yet.</p>
            )}
          </div>
        </section>

        <section className="lg:col-span-3">
          <h2 className="section-title">Knowledge graph</h2>
          <div className="mt-3 card overflow-hidden h-[420px]">
            {graphData && graphData.entities.length > 0 ? (
              <GraphVisualizer data={graphData} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center px-8 text-center">
                <p className="text-[13px] font-medium text-zinc-700">Empty graph</p>
                <p className="mt-1 max-w-xs text-xs text-zinc-400">
                  Upload a document to see concept entities and their semantic links.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="section-title">Dual-level RAG query</h2>
          <span className="text-[11px] text-zinc-400">
            Target: {selectedDoc?.title ?? 'entire knowledge base'}
          </span>
        </div>

        <form onSubmit={askRag} className="mt-3 flex gap-2">
          <input
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder="Compare two algorithms, or ask how entities relate…"
            className="input-field flex-1"
            aria-label="Query RAG"
          />
          <button type="submit" disabled={ragLoading || !ragQuery.trim()} className="btn-primary">
            {ragLoading ? 'Searching…' : 'Query'}
          </button>
        </form>

        {ragResult && (
          <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-100 p-4 text-[13px] leading-relaxed text-zinc-700 whitespace-pre-wrap">
            {ragResult}
          </div>
        )}
      </section>
    </div>
  );
}
