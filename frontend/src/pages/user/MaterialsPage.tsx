import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Trash2,
  Brain,
  MessageSquare,
  Network,
  Loader2,
  Globe,
  Plus
} from 'lucide-react';
import type { DocumentItem, KnowledgeGraphData } from '../../types';
import { api } from '../../api';
import { GraphVisualizer } from '../../components/GraphVisualizer';
import { EmptyDocuments } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';

export function MaterialsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'graph'>('list');

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');

  // Graph Viewer Modal / Selection
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGraph = useCallback(async (docId?: string) => {
    try {
      setGraphLoading(true);
      const g = await api.getGraph(docId);
      setGraphData(g);
    } catch {
      // ignore
    } finally {
      setGraphLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    if (activeTab === 'graph') {
      fetchGraph(selectedDocId);
    }
  }, [activeTab, selectedDocId, fetchGraph]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStep('Mem-parsing dan mengekstrak teks PDF...');

    try {
      setTimeout(() => setUploadStep('Mengekstrak Knowledge Graph & Topik (LightRAG)...'), 1500);
      setTimeout(() => setUploadStep('Membuat kartu Active Recall (FSRS-6)...'), 3000);

      const newDoc = await api.uploadDocument(file, title.trim() || undefined);
      success(`Materi "${newDoc.title}" berhasil diekstrak dan siap dipelajari!`);
      
      setFile(null);
      setTitle('');
      setUploadStep('');
      await fetchDocs();
    } catch (err: any) {
      error(err.message || 'Gagal mengunggah dokumen.');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Hapus materi "${docTitle}" beserta Knowledge Graph & Flashcard terkait?`)) return;
    try {
      await api.deleteDocument(docId);
      success('Materi berhasil dihapus.');
      await fetchDocs();
      if (selectedDocId === docId) setSelectedDocId(undefined);
    } catch {
      error('Gagal menghapus dokumen.');
    }
  };

  const viewDocGraph = (docId: string) => {
    setSelectedDocId(docId);
    setActiveTab('graph');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ——— HEADER ——— */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title flex items-center gap-2">
              <span>Materi Kuliah & Knowledge Base</span>
            </h1>
            <span className="badge-brand flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Worldwide & Multi-Campus
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unggah modul, slide, textbook, atau silabus PDF dari universitas manapun di dunia.
            AI akan otomatis menyusun Knowledge Graph dan Flashcards FSRS-6.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daftar Materi ({documents.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('graph');
                setSelectedDocId(undefined);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'graph'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Knowledge Graph</span>
            </button>
          </div>
        </div>
      </div>

      {/* ——— UPLOAD DROPZONE / FORM ——— */}
      <div className="card p-6 shadow-xs border border-brand-100/80 bg-gradient-to-br from-white via-white to-brand-50/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <Upload className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Unggah Materi PDF Baru</h2>
            <p className="text-[11px] text-slate-500">Mendukung format .pdf, .docx, .txt (Slide Kuliah, Catatan, Silabus)</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Judul Materi / Mata Kuliah
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: CS50 Introduction to Computer Science / Aljabar Linier"
                className="input-field"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Pilih File Dokumen
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="input-field file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                disabled={isUploading}
                required
              />
            </div>
          </div>

          {isUploading && (
            <div className="bg-brand-50/80 border border-brand-100 rounded-xl p-3.5 flex items-center gap-3 animate-fade-in">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brand-900">{uploadStep}</p>
                <p className="text-[10px] text-brand-600 mt-0.5">
                  LightRAG sedang membangun entitas relasi & FSRS-6 membentuk kartu ingatan.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isUploading || !file}
              className="btn-primary text-xs px-5 py-2.5 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengekstrak AI...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Unggah & Ekstrak Knowledge Graph</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ——— TAB CONTENT ——— */}
      {activeTab === 'list' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Dokumen Materi Terindeks ({documents.length})</h2>
            <button
              onClick={() => navigate('/app/review')}
              className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
            >
              Review Semua Flashcards &rarr;
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              <span>Memuat materi kuliah...</span>
            </div>
          ) : documents.length === 0 ? (
            <EmptyDocuments
              action={
                <p className="text-xs text-slate-400">
                  Gunakan form di atas untuk mengunggah materi perkuliahan pertama Anda.
                </p>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => {
                const createdDate = new Date(doc.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const sizeKb = Math.round(doc.file_size / 1024);

                return (
                  <div key={doc.id} className="card p-5 space-y-3.5 hover:shadow-elevated transition-all duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-brand-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate" title={doc.title}>
                            {doc.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {doc.filename} &middot; {sizeKb} KB &middot; {createdDate}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="text-slate-300 hover:text-red-500 p-1 rounded-lg transition-colors"
                        title="Hapus materi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stats badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                        {doc.entities_count} Entitas Nodes
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-medium border border-brand-100">
                        {doc.relations_count} Relasi Edges
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-medium border border-violet-100">
                        {doc.topics_count} Topik RAG
                      </span>
                    </div>

                    {/* Summary */}
                    {doc.summary && (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        {doc.summary}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => viewDocGraph(doc.id)}
                        className="btn-secondary text-xs flex-1 py-2"
                      >
                        <Network className="w-3.5 h-3.5 text-brand-500" />
                        <span>Lihat Graph</span>
                      </button>
                      <button
                        onClick={() => navigate('/app/ask')}
                        className="btn-secondary text-xs flex-1 py-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tanya AI</span>
                      </button>
                      <button
                        onClick={() => navigate('/app/review')}
                        className="btn-primary text-xs flex-1 py-2"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ——— GRAPH VIEW TAB ——— */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <span>Visualisasi Knowledge Graph</span>
                {selectedDocId ? (
                  <span className="text-xs font-normal text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                    Filter: {documents.find((d) => d.id === selectedDocId)?.title || 'Dokumen Terpilih'}
                  </span>
                ) : (
                  <span className="text-xs font-normal text-slate-400">
                    (Semua Materi Kuliah)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Peta relasi konsep antar materi kuliah. Klik dan geser node untuk eksplorasi.
              </p>
            </div>

            {selectedDocId && (
              <button
                onClick={() => setSelectedDocId(undefined)}
                className="text-xs text-slate-500 hover:text-brand-600 transition-colors"
              >
                Lihat Global Graph &rarr;
              </button>
            )}
          </div>

          <div className="card overflow-hidden h-[450px]">
            {graphLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500 mr-2" />
                <span>Memuat graf relasi materi...</span>
              </div>
            ) : graphData && graphData.entities.length > 0 ? (
              <GraphVisualizer data={graphData} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <Network className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum ada node Knowledge Graph</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Unggah file materi perkuliahan PDF untuk mengekstrak entitas dan relasi visual secara otomatis.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
