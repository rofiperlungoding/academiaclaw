import React, { useState } from 'react';
import {
  Upload,
  Trash2,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Loader2,
  FileUp
} from 'lucide-react';
import type { DocumentItem, KnowledgeGraphData } from '../types';
import { GraphVisualizer } from './GraphVisualizer';
import { api } from '../api';

interface KnowledgeStudioViewProps {
  documents: DocumentItem[];
  graphData: KnowledgeGraphData | null;
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  onRefresh: () => void;
}

export const KnowledgeStudioView: React.FC<KnowledgeStudioViewProps> = ({
  documents,
  graphData,
  selectedDocId,
  setSelectedDocId,
  onRefresh,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [ragQuery, setRagQuery] = useState('');
  const [isAskingRag, setIsAskingRag] = useState(false);
  const [ragResult, setRagResult] = useState<{
    query: string;
    answer: string;
    low_level_facts: any[];
    high_level_topics: any[];
    used_model: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!uploadTitle) {
        setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      await api.uploadDocument(selectedFile, uploadTitle);
      setSelectedFile(null);
      setUploadTitle('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Hapus dokumen ini beserta relasi graph dan flashcard terkait?')) return;
    try {
      await api.deleteDocument(docId);
      if (selectedDocId === docId) setSelectedDocId(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus dokumen');
    }
  };

  const handleAskRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    try {
      setIsAskingRag(true);
      const res = await api.askRag(
        ragQuery,
        selectedDocId && selectedDocId !== 'global' ? [selectedDocId] : undefined
      );
      setRagResult(res);
    } catch (err: any) {
      alert(err.message || 'RAG query failed');
    } finally {
      setIsAskingRag(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Knowledge Studio & Dual-Level LightRAG
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ingest PDF atau catatan kuliah. LightRAG mengekstrak Low-Level Entities dan High-Level Topics secara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDocId || 'global'}
            onChange={(e) => setSelectedDocId(e.target.value === 'global' ? null : e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="global">Global Knowledge Graph (Semua Materi)</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Interactive Graph Visualizer
              </span>
              <span className="text-xs text-slate-400">
                {graphData?.doc_title || 'Global Graph'}
              </span>
            </div>

            {graphData && (
              <GraphVisualizer
                entities={graphData.entities}
                relations={graphData.relations}
                topics={graphData.topics}
              />
            )}
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Ask Dual-Level RAG Query
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Menghubungkan entitas tingkat rendah (*facts*) dengan topik abstrak tingkat tinggi (*concepts*) untuk penalaran multi-hop.
            </p>

            <form onSubmit={handleAskRag} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  placeholder="Misal: Jelaskan bagaimana cache mapping mempengaruhi performa pipeline CPU..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isAskingRag || !ragQuery.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-all shrink-0 shadow-md shadow-blue-600/30"
              >
                {isAskingRag ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Sintesis
              </button>
            </form>

            {ragResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-blue-400 font-semibold">
                    LightRAG Synthesized Response
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{ragResult.used_model}</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {ragResult.answer}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">Retrieved Facts:</span>
                  {ragResult.low_level_facts.slice(0, 4).map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700"
                    >
                      {f.name || `${f.source_name} -> ${f.target_name}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <FileUp className="w-4 h-4 text-blue-400" />
              Upload Materi Perkuliahan
            </h3>

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Judul Materi / Mata Kuliah
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Misal: Arsitektur Komputer - Bab 4 Cache"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  File Dokumen (PDF, MD, TXT)
                </label>
                <input
                  type="file"
                  accept=".pdf,.md,.txt"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-md shadow-blue-600/30"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses Dual-Level Extraction...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Ekstrak Knowledge Graph
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-emerald-400" />
              Daftar Dokumen Terindeks ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                Belum ada materi kuliah diunggah.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-xl border transition-all ${
                      selectedDocId === doc.id
                        ? 'bg-blue-950/40 border-blue-500/50'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="cursor-pointer flex-1"
                        onClick={() => setSelectedDocId(doc.id)}
                      >
                        <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                          {doc.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.filename} · {(doc.file_size / 1024).toFixed(1)} KB
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Hapus dokumen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="text-emerald-400">{doc.entities_count} nodes</span>
                      <span>·</span>
                      <span className="text-blue-400">{doc.relations_count} edges</span>
                      <span>·</span>
                      <span className="text-purple-400">{doc.topics_count} topics</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
