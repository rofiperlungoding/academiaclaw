import { useEffect, useState } from 'react';
import { Plus, Check, Circle, Clock, X, Search, Filter, Trash2, Calendar } from 'lucide-react';
import type { AcademicTask } from '../../types';
import { api } from '../../api';

const COURSE_PRESETS = [
  'Algoritma dan Struktur Data',
  'Sistem Basis Data',
  'Rangkaian Elektronika Lanjut',
  'Arsitektur dan Organisasi Komputer',
  'Kewirausahaan'
];

export function SchedulePage() {
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  
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
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task.id, { status: newStatus });
      fetchTasks();
    } catch {
      alert('Gagal memperbarui status tugas.');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Hapus agenda ini?')) return;
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
      alert('Gagal menambahkan agenda.');
    }
  };

  const now = new Date();
  const categorize = (task: AcademicTask) => {
    if (task.status === 'completed') return 'done';
    const diff = Math.ceil((new Date(task.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return 'today';
    if (diff <= 7) return 'week';
    return 'later';
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.course.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || t.course === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const coursesList = Array.from(new Set(tasks.map((t) => t.course).filter(Boolean)));

  const groups = [
    { key: 'today', label: 'Hari Ini & Mendesak', items: filteredTasks.filter((t) => categorize(t) === 'today') },
    { key: 'week', label: 'Minggu Ini', items: filteredTasks.filter((t) => categorize(t) === 'week') },
    { key: 'later', label: 'Mendatang', items: filteredTasks.filter((t) => categorize(t) === 'later') },
    { key: 'done', label: 'Selesai', items: filteredTasks.filter((t) => categorize(t) === 'done') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Jadwal & Deadline Kuliah
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen agenda tugas, kuis, dan praktikum terintegrasi dengan proactive heartbeat.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Agenda</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tugas atau mata kuliah..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          >
            <option value="all">Semua Mata Kuliah</option>
            {coursesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {groups.map((group) => {
          if (group.items.length === 0) return null;
          return (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {group.label}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {group.items.length} item
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const dlDate = new Date(task.deadline);
                  const diffDays = Math.ceil((dlDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={task.id}
                      className={`flex items-start sm:items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                        isCompleted
                          ? 'bg-slate-50/80 border-slate-100 opacity-60'
                          : 'bg-white border-slate-200/90 hover:shadow-card hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => handleToggle(task)}
                        className={`mt-0.5 sm:mt-0 shrink-0 transition-colors ${
                          isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}>
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
                          <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {task.course}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {task.task_type}
                          </span>
                          {task.notes && (
                            <span className="text-[11px] text-slate-400 truncate max-w-xs hidden md:inline">
                              &middot; {task.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {!isCompleted && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className={
                              diffDays <= 1 ? 'text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded' :
                              diffDays <= 3 ? 'text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded' :
                              'text-slate-600 bg-slate-50 px-2 py-0.5 rounded'
                            }>
                              {diffDays <= 0 ? 'Hari ini' : `${diffDays}d`}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Hapus task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Tidak ada agenda ditemukan</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Coba sesuaikan kata kunci pencarian atau filter mata kuliah.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Agenda Baru</span>
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-elevated animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Tambah Agenda Kuliah</h3>
                <p className="text-xs text-slate-400">Jadwal akan dimonitor oleh OpenClaw Heartbeat.</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nama Tugas / Aktivitas</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Praktikum AVL Tree & Graph ADT"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Mata Kuliah</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Algoritma dan Struktur Data"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 mb-1.5"
                  required
                />
                <div className="flex flex-wrap gap-1">
                  {COURSE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCourse(p)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Jenis Agenda</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  >
                    <option value="Tugas">Tugas</option>
                    <option value="Praktikum">Praktikum</option>
                    <option value="Kuis">Kuis</option>
                    <option value="Laporan">Laporan</option>
                    <option value="Ujian">Ujian (UTS/UAS)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  >
                    <option value="high">Tinggi (High)</option>
                    <option value="medium">Sedang (Medium)</option>
                    <option value="low">Rendah (Low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Tenggat Waktu (Deadline)</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kriteria penilaian, format file, atau instruksi dosen..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
