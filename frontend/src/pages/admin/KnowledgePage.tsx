import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, Search, FileText } from 'lucide-react';
import type { DocumentItem, KnowledgeGraphData } from '../../types';
import { api } from '../../api';
import { GraphVisualizer } from '../../components/GraphVisualizer';

export function KnowledgePage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState<string | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const fetchDocs = async () => {
    try { setDocs(await api.getDocuments()); } catch { setDocs([]); }
  };

  const fetchGraph = async (docId?: string | null) => {
    try { setGraphData(await api.getGraph(docId || undefined)); } catch { setGraphData(null); }
  };

  useEffect(() => { fetchDocs(); fetchGraph(); }, []);
  useEffect(() => { fetchGraph(selectedDocId); }, [selectedDocId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadDocument(file);
      fetchDocs();
      fetchGraph(selectedDocId);
    } catch (err: any) {
      alert(err.message || 'Upload gagal');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Hapus dokumen ini beserta semua entitas dan flashcard terkait?')) return;
    try {
      await api.deleteDocument(docId);
      if (selectedDocId === docId) setSelectedDocId(null);
      fetchDocs();
      fetchGraph(null);
    } catch {
      alert('Gagal menghapus');
    }
  };

  const handleAskRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    try {
      const res = await api.askRag(ragQuery, selectedDocId ? [selectedDocId] : undefined);
      setRagResult(res.answer);
    } catch {
      setRagResult('Gagal mendapatkan jawaban dari RAG.');
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Knowledge Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">Upload materi, visualisasi knowledge graph, dan query Dual-Level RAG.</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".pdf,.md,.txt" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm shadow-blue-200"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Mengupload...' : 'Upload Dokumen'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Dokumen ({docs.length})
          </h3>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            <button
              onClick={() => setSelectedDocId(null)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                selectedDocId === null
                  ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Semua Dokumen
            </button>
            {docs.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                  selectedDocId === doc.id
                    ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedDocId(doc.id)}
              >
                <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{doc.title}</p>
                  <p className="text-[10px] text-slate-400">{doc.entities_count}E / {doc.relations_count}R / {doc.topics_count}T</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
          {graphData && (graphData.entities.length > 0 || graphData.relations.length > 0) ? (
            <GraphVisualizer data={graphData} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">
              Upload dokumen untuk melihat knowledge graph.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          Ask Dual-Level RAG
        </h3>
        <form onSubmit={handleAskRag} className="flex gap-2">
          <input
            type="text"
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder="Tanyakan sesuatu tentang materi yang sudah diupload..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
          <button
            type="submit"
            disabled={ragLoading || !ragQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium transition-colors shadow-sm shadow-blue-200"
          >
            {ragLoading ? 'Mencari...' : 'Tanya'}
          </button>
        </form>
        {ragResult && (
          <div className="mt-3 p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
            {ragResult}
          </div>
        )}
      </div>
    </div>
  );
}
