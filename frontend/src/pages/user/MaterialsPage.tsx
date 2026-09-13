import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Loader2, Network } from 'lucide-react';
import type { DocumentItem, KnowledgeGraphData } from '../../types';
import { api } from '../../api';
import { GraphVisualizer } from '../../components/GraphVisualizer';
import { EmptyDocuments } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';

type Tab = 'list' | 'graph';

export function MaterialsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('list');

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [selectedDocId, setSelectedDocId] = useState<string | undefined>();
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments(await api.getDocuments());
    } catch {
      /* keep previous list */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGraph = useCallback(async (docId?: string) => {
    setGraphLoading(true);
    try {
      setGraphData(await api.getGraph(docId));
    } catch {
      setGraphData(null);
    } finally {
      setGraphLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    if (activeTab === 'graph') fetchGraph(selectedDocId);
  }, [activeTab, selectedDocId, fetchGraph]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const doc = await api.uploadDocument(file, title.trim() || undefined);
      success(`"${doc.title}" indexed: ${doc.entities_count} entities, ${doc.topics_count} topics.`);
      setFile(null);
      setTitle('');
      await fetchDocs();
    } catch (err) {
      error(err instanceof Error ? err.message : 'Could not upload the document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Delete "${docTitle}" along with its knowledge graph and flashcards?`)) return;
    try {
      await api.deleteDocument(docId);
      success('Material deleted.');
      if (selectedDocId === docId) setSelectedDocId(undefined);
      await fetchDocs();
    } catch {
      error('Could not delete the document.');
    }
  };

  const selectedTitle = documents.find((d) => d.id === selectedDocId)?.title;

  return (
    <div className="animate-fade-in">
      <header>
        <h1 className="page-title">Material</h1>
        <p className="mt-1 muted max-w-lg">
          Upload slides, modules, textbooks, or a syllabus from any campus. The system builds
          the knowledge graph and FSRS-6 cards automatically.
        </p>
      </header>

      {/* upload */}
      <form onSubmit={handleUpload} className="mt-8 pb-8 border-b border-zinc-100 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="doc-title">Title</label>
            <input
              id="doc-title"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Linear Algebra · Chapter 3"
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="label" htmlFor="doc-file">File (.pdf, .docx, .txt)</label>
            <input
              id="doc-file"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              disabled={isUploading}
              required
              className="input-field py-1.5 cursor-pointer file:mr-3 file:h-6 file:px-2 file:rounded file:border-0 file:bg-zinc-100 file:text-[11px] file:font-medium file:text-zinc-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isUploading || !file} className="btn-primary">
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isUploading ? 'Extracting…' : 'Upload & index'}
          </button>
          {isUploading && (
            <p className="text-xs text-zinc-400">
              LightRAG is extracting entities and relations, FSRS-6 is building cards. Takes a few seconds.
            </p>
          )}
        </div>
      </form>

      {/* tabs */}
      <div className="mt-8 flex items-center gap-1">
        {([['list', `Documents (${documents.length})`], ['graph', 'Knowledge graph']] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                if (key === 'graph') setSelectedDocId(undefined);
              }}
              className={`h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === key ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {activeTab === 'list' ? (
        <div className="mt-5">
          {loading ? (
            <p className="py-12 text-center text-[13px] text-zinc-400">Loading material…</p>
          ) : documents.length === 0 ? (
            <EmptyDocuments
              action={
                <p className="text-xs text-zinc-400">
                  Use the form above to upload your first document.
                </p>
              }
            />
          ) : (
            <div className="list border-t border-zinc-100">
              {documents.map((doc) => (
                <article key={doc.id} className="py-5">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-medium text-zinc-900 truncate">{doc.title}</h3>
                      <p className="mt-0.5 text-xs text-zinc-400 truncate">
                        {doc.filename} · {Math.round(doc.file_size / 1024)} KB ·{' '}
                        {new Date(doc.created_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="btn-ghost btn-sm text-zinc-300 hover:text-red-600"
                      title="Delete material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {doc.summary && (
                    <p className="mt-3 text-[13px] leading-relaxed text-zinc-500 line-clamp-3 max-w-prose">
                      {doc.summary}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                    <span>{doc.entities_count} entities</span>
                    <span>{doc.relations_count} relations</span>
                    <span>{doc.topics_count} topics</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setActiveTab('graph');
                      }}
                      className="btn-secondary btn-sm"
                    >
                      View graph
                    </button>
                    <button onClick={() => navigate('/app/ask')} className="btn-secondary btn-sm">
                      Ask AI
                    </button>
                    <button onClick={() => navigate('/app/review')} className="btn-secondary btn-sm">
                      Review
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[13px] text-zinc-500">
              {selectedTitle ? `Filter: ${selectedTitle}` : 'All material'}
            </p>
            {selectedDocId && (
              <button
                onClick={() => setSelectedDocId(undefined)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                View global graph
              </button>
            )}
          </div>

          <div className="mt-3 card overflow-hidden h-[440px]">
            {graphLoading ? (
              <div className="h-full flex items-center justify-center text-[13px] text-zinc-400">
                Loading relation graph…
              </div>
            ) : graphData && graphData.entities.length > 0 ? (
              <GraphVisualizer data={graphData} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center px-8 text-center">
                <Network className="w-6 h-6 text-zinc-300" strokeWidth={1.5} />
                <p className="mt-3 text-[13px] font-medium text-zinc-700">No nodes yet</p>
                <p className="mt-1 max-w-xs text-xs text-zinc-400">
                  Upload material to extract entities and relations automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
