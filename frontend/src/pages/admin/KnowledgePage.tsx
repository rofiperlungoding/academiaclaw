import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, Search, FileText, Sparkles, Layers } from 'lucide-react';
import type { DocumentItem, KnowledgeGraphData } from '../../types';
import { api } from '../../api';
import { GraphVisualizer } from '../../components/GraphVisualizer';

export function KnowledgePage() {
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
      const data = await api.getDocuments();
      setDocs(data);
    } catch {
      setDocs([]);
    }
  };

  const fetchGraph = async (docId?: string | null) => {
    try {
      const data = await api.getGraph(docId || undefined);
      setGraphData(data);
    } catch {
      setGraphData(null);
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchGraph();
  }, []);

  useEffect(() => {
    fetchGraph(selectedDocId);
  }, [selectedDocId]);

  const processFile = async (file: File) => {
    setUploading(true);
    try {
      await api.uploadDocument(file);
      await fetchDocs();
      await fetchGraph(selectedDocId);
    } catch (err: any) {
      alert(err.message || 'Upload dan ekstraksi graph gagal.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Hapus dokumen ini? Semua entitas graph, topik, dan flashcard terkait akan dihapus.')) return;
    try {
      await api.deleteDocument(docId);
      if (selectedDocId === docId) setSelectedDocId(null);
      fetchDocs();
      fetchGraph(null);
    } catch {
      alert('Gagal menghapus dokumen.');
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
      setRagResult('Gagal mengeksekusi query Dual-Level RAG. Pastikan backend aktif.');
    } finally {
      setRagLoading(false);
    }
  };

  const selectedDoc = docs.find((d) => d.id === selectedDocId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Knowledge Studio & LightRAG</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100 font-medium">
              Dual-Level Graph
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekstraksi otomatis entitas, relasi, topik makro, flashcard FSRS-6, dan agenda tugas dari PDF/dokumen kuliah.
          </p>
        </div>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.md,.txt"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm shadow-brand-200"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Mengekstrak Dokumen...' : 'Upload Materi Kuliah'}</span>
          </button>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
          isDragOver
            ? 'border-brand-400 bg-brand-50/50'
            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Upload className="w-4 h-4 text-brand-500" />
          <span>Drag and drop file PDF atau slide kuliah di sini untuk auto-ekstraksi LightRAG & Flashcard.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Dokumen Terdaftar ({docs.length})
            </h3>
            {selectedDocId && (
              <button
                onClick={() => setSelectedDocId(null)}
                className="text-[11px] text-brand-600 hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedDocId(null)}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs transition-all flex items-center justify-between ${
                selectedDocId === null
                  ? 'bg-brand-50 text-brand-900 font-semibold border border-brand-200 shadow-2xs'
                  : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-500" />
                <span>Seluruh Graf Pengetahuan Global</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">All</span>
            </button>

            {docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`p-3.5 rounded-xl text-xs transition-all cursor-pointer border ${
                  selectedDocId === doc.id
                    ? 'bg-brand-50/70 text-brand-950 border-brand-200 shadow-xs'
                    : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 shrink-0 text-brand-500" />
                    <p className="font-medium truncate">{doc.title}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-0.5"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
                  <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                    {doc.entities_count} Entitas
                  </span>
                  <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                    {doc.relations_count} Relasi
                  </span>
                  <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                    {doc.topics_count} Topik
                  </span>
                </div>
              </div>
            ))}

            {docs.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                Belum ada dokumen yang diupload.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col" style={{ minHeight: '440px' }}>
          {graphData && (graphData.entities.length > 0 || graphData.relations.length > 0) ? (
            <GraphVisualizer data={graphData} />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
              <Layers className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-600">Graf Pengetahuan Kosong</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Upload dokumen materi kuliah untuk melihat visualisasi entitas konsep dan hubungan semantiknya.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-600" />
            <span>Ask Dual-Level RAG Engine</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            {selectedDocId ? `Target: ${selectedDoc?.title || 'Selected Doc'}` : 'Target: Seluruh Knowledge Base'}
          </span>
        </div>

        <form onSubmit={handleAskRag} className="flex gap-2">
          <input
            type="text"
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder="Tanyakan konsep mendalam, perbandingan algoritma, atau relasi entitas..."
            className="flex-1 bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50 shadow-xs"
          />
          <button
            type="submit"
            disabled={ragLoading || !ragQuery.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs sm:text-sm font-medium transition-colors shadow-sm shadow-brand-200 flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ragLoading ? 'Mencari di Graf...' : 'Query RAG'}</span>
          </button>
        </form>

        {ragResult && (
          <div className="mt-3 p-4 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap border border-slate-200/80 shadow-2xs">
            {ragResult}
          </div>
        )}
      </div>
    </div>
  );
}
