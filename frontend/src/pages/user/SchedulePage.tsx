import { useEffect, useState } from 'react';
import { Plus, Check, Circle, Clock, X } from 'lucide-react';
import type { AcademicTask } from '../../types';
import { api } from '../../api';

export function SchedulePage() {
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [showAdd, setShowAdd] = useState(false);
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

  useEffect(() => { fetchTasks(); }, []);

  const handleToggle = async (task: AcademicTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task.id, { status: newStatus });
      fetchTasks();
    } catch {
      alert('Update gagal');
    }
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
      alert('Gagal menambahkan agenda');
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

  const groups = [
    { key: 'today', label: 'Hari Ini', items: tasks.filter((t) => categorize(t) === 'today') },
    { key: 'week', label: 'Minggu Ini', items: tasks.filter((t) => categorize(t) === 'week') },
    { key: 'later', label: 'Nanti', items: tasks.filter((t) => categorize(t) === 'later') },
    { key: 'done', label: 'Selesai', items: tasks.filter((t) => categorize(t) === 'done') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Jadwal & Deadline</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manajemen tugas dan deadline perkuliahan.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors shadow-sm shadow-blue-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah
        </button>
      </div>

      <div className="space-y-6">
        {groups.map((group) => {
          if (group.items.length === 0) return null;
          return (
            <div key={group.key}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                {group.label}
                <span className="ml-1.5 text-slate-300">({group.items.length})</span>
              </h3>
              <div className="space-y-1.5">
                {group.items.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const dlDate = new Date(task.deadline);
                  const diffDays = Math.ceil((dlDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isCompleted
                          ? 'bg-slate-50 border-slate-100 opacity-60'
                          : 'bg-white border-slate-200 hover:shadow-card hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => handleToggle(task)}
                        className={`shrink-0 transition-colors ${
                          isCompleted ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {task.course}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            task.priority === 'high' ? 'text-red-600 bg-red-50' :
                            task.priority === 'medium' ? 'text-amber-600 bg-amber-50' :
                            'text-slate-500 bg-slate-50'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      {!isCompleted && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span className={
                            diffDays <= 1 ? 'text-red-500 font-semibold' :
                            diffDays <= 3 ? 'text-amber-500 font-medium' : ''
                          }>
                            {diffDays <= 0 ? 'Hari ini' : `${diffDays}d`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-elevated animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-900">Tambah Agenda</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Tugas</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tugas Praktikum AVL Tree"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tipe</label>
                  <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50">
                    <option value="Tugas">Tugas</option>
                    <option value="Praktikum">Praktikum</option>
                    <option value="Kuis">Kuis</option>
                    <option value="Laporan">Laporan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Mata Kuliah</label>
                  <input type="text" value={course} onChange={(e) => setCourse(e.target.value)}
                    placeholder="ASD"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Prioritas</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Deadline</label>
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Catatan</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail instruksi..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200">
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
