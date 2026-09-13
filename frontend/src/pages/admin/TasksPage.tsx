import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Circle, X, Search } from 'lucide-react';
import type { AcademicTask, HeartbeatSummary } from '../../types';
import { api } from '../../api';
import { EmptyTasks } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';

const TASK_TYPES = ['Assignment', 'Lab', 'Quiz', 'Report', 'Exam'];
const PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Done' },
] as const;

const daysUntil = (deadline: string) =>
  Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);

export function TasksPage() {
  const { error } = useToast();
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState('');

  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [taskType, setTaskType] = useState('Assignment');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');

  const fetchTasks = async () => {
    try {
      setTasks(await api.getTasks());
    } catch {
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!showAdd) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowAdd(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAdd]);

  const toggle = async (task: AcademicTask) => {
    try {
      await api.updateTask(task.id, {
        status: task.status === 'completed' ? 'pending' : 'completed',
      });
      fetchTasks();
    } catch {
      error('Could not update the task status.');
    }
  };

  const remove = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      fetchTasks();
    } catch {
      error('Could not delete the task.');
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !course.trim() || !deadline) {
      return setFormError('Title, course, and deadline are required.');
    }
    try {
      await api.createTask({
        title: title.trim(),
        course: course.trim(),
        task_type: taskType,
        deadline: new Date(deadline).toISOString(),
        priority,
        notes: notes.trim(),
      });
      setTitle('');
      setCourse('');
      setDeadline('');
      setNotes('');
      setFormError('');
      setShowAdd(false);
      fetchTasks();
    } catch {
      setFormError('Could not create the task.');
    }
  };

  const runHeartbeat = async () => {
    setChecking(true);
    try {
      setHeartbeat(await api.getHeartbeatSummary());
    } catch {
      error('Heartbeat check failed.');
    } finally {
      setChecking(false);
    }
  };

  const q = search.toLowerCase();
  const filtered = tasks.filter(
    (t) =>
      (filter === 'all' || t.status === filter) &&
      (t.title.toLowerCase().includes(q) || t.course.toLowerCase().includes(q))
  );

  const courses = Array.from(new Set(tasks.map((t) => t.course).filter(Boolean)));

  return (
    <div className="animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="mt-1 muted max-w-lg">
            Academic deadlines watched by the OpenClaw heartbeat cron.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runHeartbeat} disabled={checking} className="btn-secondary btn-sm">
            {checking ? 'Checking…' : 'Run heartbeat'}
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </header>

      {heartbeat && (
        <dl className="mt-6 grid grid-cols-3 border-y border-zinc-100 animate-fade-in">
          <div className="py-4 pr-5">
            <dt className="text-xl font-semibold text-zinc-900 leading-none">
              {heartbeat.urgent_tasks_count}
            </dt>
            <dd className="mt-1.5 text-xs text-zinc-500">Urgent tasks</dd>
          </div>
          <div className="py-4 pr-5">
            <dt className="text-xl font-semibold text-zinc-900 leading-none">
              {heartbeat.due_flashcards_count}
            </dt>
            <dd className="mt-1.5 text-xs text-zinc-500">Cards due</dd>
          </div>
          <div className="py-4">
            <dt className="text-xl font-semibold text-zinc-900 leading-none">
              {heartbeat.proactive_notification_recommended ? 'Yes' : 'No'}
            </dt>
            <dd className="mt-1.5 text-xs text-zinc-500">Push recommended</dd>
          </div>
        </dl>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or courses…"
            className="input-field pl-8"
            aria-label="Search tasks"
          />
        </div>
        <div className="flex gap-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`h-9 px-3 rounded-md text-[13px] font-medium transition-colors ${
                filter === f.value ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {filtered.length === 0 ? (
          tasks.length === 0 ? (
            <EmptyTasks />
          ) : (
            <p className="py-14 text-center text-[13px] text-zinc-400 border-t border-zinc-100">
              No matching tasks.
            </p>
          )
        ) : (
          <div className="list border-t border-zinc-100">
            {filtered.map((task) => {
              const done = task.status === 'completed';
              const d = daysUntil(task.deadline);
              const tone = d <= 1 ? 'text-red-600' : d <= 3 ? 'text-amber-600' : 'text-zinc-400';

              return (
                <div key={task.id} className="list-row group">
                  <button
                    onClick={() => toggle(task)}
                    className={`shrink-0 ${
                      done ? 'text-emerald-600' : 'text-zinc-300 hover:text-zinc-600'
                    }`}
                    aria-label={done ? 'Mark as not done' : 'Mark as done'}
                  >
                    {done ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] font-medium truncate ${
                        done ? 'line-through text-zinc-400' : 'text-zinc-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400 truncate">
                      {task.course} · {task.task_type} · {task.priority}
                      {task.notes ? ` · ${task.notes}` : ''}
                    </p>
                  </div>

                  {!done && (
                    <span className={`text-xs shrink-0 ${tone}`}>
                      {d <= 0 ? 'Today' : `${d}d`}
                    </span>
                  )}

                  <button
                    onClick={() => remove(task.id)}
                    className="shrink-0 text-zinc-200 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-zinc-900/20 flex items-center justify-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add task"
            className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-overlay animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Add task</h2>
              <button onClick={() => setShowAdd(false)} className="btn-ghost btn-sm" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={create} className="p-5 space-y-4">
              <div>
                <label className="label" htmlFor="at-title">Task name</label>
                <input
                  id="at-title"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="label" htmlFor="at-course">Course</label>
                <input
                  id="at-course"
                  className="input-field"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  list="admin-course-presets"
                />
                <datalist id="admin-course-presets">
                  {courses.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="at-type">Type</label>
                  <select
                    id="at-type"
                    className="input-field"
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                  >
                    {TASK_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="at-priority">Priority</label>
                  <select
                    id="at-priority"
                    className="input-field"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="at-deadline">Deadline</label>
                <input
                  id="at-deadline"
                  type="datetime-local"
                  className="input-field"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="at-notes">Notes</label>
                <textarea
                  id="at-notes"
                  rows={2}
                  className="input-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {formError && <p role="alert" className="text-[13px] text-red-600">{formError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
