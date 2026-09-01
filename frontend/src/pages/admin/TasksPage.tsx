import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Circle, X } from 'lucide-react';
import type { AcademicTask } from '../../types';
import { api } from '../../api';

export function TasksPage() {
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [taskType, setTaskType] = useState('Tugas');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');

  const fetchTasks = async () => {
    try { setTasks(await api.getTasks()); } catch { setTasks([]); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleToggle = async (task: AcademicTask) => {
    try {
      await api.updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' });
      fetchTasks();
    } catch {
      alert('Update gagal');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Hapus task ini?')) return;
    try { await api.deleteTask(taskId); fetchTasks(); } catch { alert('Delete gagal'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !course.trim() || !deadline) return;
    try {
      await api.createTask({
        title, course, task_type: taskType,
        deadline: new Date(deadline).toISOString(),
        priority, notes,
      });
      setTitle(''); setCourse(''); setDeadline(''); setNotes('');
      setShowAdd(false);
      fetchTasks();
    } catch {
      alert('Gagal membuat task');
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Task Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">CRUD lengkap untuk semua tugas akademik.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors shadow-sm shadow-blue-200">
          <Plus className="w-3.5 h-3.5" />
          Tambah
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['all', 'pending', 'completed'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {s === 'all' ? 'Semua' : s === 'pending' ? 'Pending' : 'Selesai'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Tidak ada task.</p>
        ) : (
          filtered.map((task) => {
            const isCompleted = task.status === 'completed';
            const dlDate = new Date(task.deadline);
            return (
              <div key={task.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isCompleted ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:shadow-card'
                }`}>
                <button onClick={() => handleToggle(task)}
                  className={`shrink-0 ${isCompleted ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-400'} transition-colors`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{task.course}</span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{task.task_type}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      task.priority === 'high' ? 'text-red-600 bg-red-50' :
                      task.priority === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-50'
                    }`}>{task.priority}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-mono shrink-0">
                  {dlDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </div>
                <button onClick={() => handleDelete(task.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
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
              <h3 className="text-base font-semibold text-slate-900">Tambah Task</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nama tugas"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
              <div className="grid grid-cols-3 gap-2">
                <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400">
                  <option value="Tugas">Tugas</option><option value="Praktikum">Praktikum</option>
                  <option value="Kuis">Kuis</option><option value="Laporan">Laporan</option>
                </select>
                <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Mata Kuliah"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400" />
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400">
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400" />
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400" />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                <button type="submit"
                  className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 shadow-sm shadow-blue-200">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
