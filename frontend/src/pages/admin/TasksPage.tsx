import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Circle, X, Search, Sparkles, AlertTriangle } from 'lucide-react';
import type { AcademicTask, HeartbeatSummary } from '../../types';
import { api } from '../../api';

export function TasksPage() {
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);
  const [triggeringHeartbeat, setTriggeringHeartbeat] = useState(false);

  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [taskType, setTaskType] = useState('Tugas');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');

  const fetchTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch {
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggle = async (task: AcademicTask) => {
    try {
      await api.updateTask(task.id, {
        status: task.status === 'completed' ? 'pending' : 'completed',
      });
      fetchTasks();
    } catch {
      alert('Gagal memperbarui status tugas.');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Hapus tugas ini?')) return;
    try {
      await api.deleteTask(taskId);
      fetchTasks();
    } catch {
      alert('Gagal menghapus tugas.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !course.trim() || !deadline) return;
    try {
      await api.createTask({
        title,
        course,
        task_type: taskType,
        deadline: new Date(deadline).toISOString(),
        priority,
        notes,
      });
      setTitle('');
      setCourse('');
      setDeadline('');
      setNotes('');
      setShowAdd(false);
      fetchTasks();
    } catch {
      alert('Gagal membuat tugas.');
    }
  };

  const handleRunHeartbeat = async () => {
    setTriggeringHeartbeat(true);
    try {
      const res = await api.getHeartbeatSummary();
      setHeartbeat(res);
    } catch {
      alert('Gagal menjalankan heartbeat check.');
    } finally {
      setTriggeringHeartbeat(false);
    }
  };

  const filtered = tasks.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.course.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Academic Task Management</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium">
              OpenClaw Cron Heartbeat
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen tugas perkuliahan, sinkronisasi deadline, dan pemantauan notifikasi proaktif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunHeartbeat}
            disabled={triggeringHeartbeat}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{triggeringHeartbeat ? 'Checking...' : 'Run Heartbeat Check'}</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-colors shadow-sm shadow-brand-200"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Task</span>
          </button>
        </div>
      </div>

      {heartbeat && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 animate-scale-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-semibold text-amber-900">
                Hasil Pemindaian Heartbeat Daemon
              </h3>
            </div>
            <button onClick={() => setHeartbeat(null)} className="text-amber-600 hover:text-amber-800 text-xs">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-amber-800 mb-2">
            Terdeteksi {heartbeat.urgent_tasks_count} tugas mendekati deadline dalam 3 hari ke depan dan {heartbeat.due_flashcards_count} flashcard siap review.
          </p>
          <div className="text-[10px] font-mono text-amber-700">
            Timestamp: {heartbeat.timestamp} | Proactive Notification: {heartbeat.proactive_notification_recommended ? 'Recommended' : 'Standby'}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tugas atau mata kuliah..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === s
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s === 'all' ? 'Semua' : s === 'pending' ? 'Pending' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-xs text-slate-400">
            Tidak ada data tugas yang cocok.
          </div>
        ) : (
          filtered.map((task) => {
            const isCompleted = task.status === 'completed';
            const dlDate = new Date(task.deadline);
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50/80 border-slate-100 opacity-60'
                    : 'bg-white border-slate-200/90 hover:shadow-card hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => handleToggle(task)}
                  className={`shrink-0 transition-colors ${
                    isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      task.priority === 'high' ? 'text-red-700 bg-red-50 border border-red-100' :
                      task.priority === 'medium' ? 'text-amber-700 bg-amber-50 border border-amber-100' :
                      'text-slate-600 bg-slate-100'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {task.course}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {task.task_type}
                    </span>
                    {task.notes && (
                      <span className="text-[11px] text-slate-400 truncate max-w-sm hidden md:inline">
                        &middot; {task.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono shrink-0 ml-2">
                  {dlDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-elevated animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-900">Tambah Tugas Kuliah</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Judul Tugas</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Laporan Praktikum Op-Amp"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Jenis</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-400"
                  >
                    <option value="Tugas">Tugas</option>
                    <option value="Praktikum">Praktikum</option>
                    <option value="Kuis">Kuis</option>
                    <option value="Laporan">Laporan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Mata Kuliah</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="ASD"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-400"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 shadow-sm shadow-brand-200"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
