import { useEffect, useState } from 'react';
import { Plus, Check, Circle, Trash2, Search, X } from 'lucide-react';
import type { AcademicTask } from '../../types';
import { api } from '../../api';

const TASK_TYPES = ['Assignment', 'Lab', 'Quiz', 'Report', 'Exam'];
const PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const daysUntil = (deadline: string) =>
  Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);

export function SchedulePage() {
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
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
      /* server rejected; list stays as-is */
    }
  };

  const remove = async (taskId: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.deleteTask(taskId);
      fetchTasks();
    } catch {
      /* keep list */
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
      setFormError('Could not add the item.');
    }
  };

  // Course list comes from the user's own tasks, so this works for any campus.
  const courses = Array.from(new Set(tasks.map((t) => t.course).filter(Boolean)));

  const q = search.toLowerCase();
  const filtered = tasks.filter(
    (t) =>
      (t.title.toLowerCase().includes(q) || t.course.toLowerCase().includes(q)) &&
      (selectedCourse === 'all' || t.course === selectedCourse)
  );

  const bucket = (t: AcademicTask) => {
    if (t.status === 'completed') return 'done';
    const d = daysUntil(t.deadline);
    if (d <= 1) return 'today';
    if (d <= 7) return 'week';
    return 'later';
  };

  const groups = [
    { key: 'today', label: 'Urgent' },
    { key: 'week', label: 'This week' },
    { key: 'later', label: 'Upcoming' },
    { key: 'done', label: 'Done' },
  ].map((g) => ({ ...g, items: filtered.filter((t) => bucket(t) === g.key) }));

  return (
    <div className="animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="mt-1 muted">Watched by the OpenClaw heartbeat.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </header>

      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or courses…"
            className="input-field pl-8"
            aria-label="Search items"
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="input-field sm:w-52"
          aria-label="Filter by course"
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 py-12 text-center border-t border-zinc-100">
          <p className="text-[13px] text-zinc-500">No items found.</p>
          <button onClick={() => setShowAdd(true)} className="btn-secondary btn-sm mt-4">
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-9">
          {groups.map(
            (group) =>
              group.items.length > 0 && (
                <section key={group.key}>
                  <div className="flex items-baseline justify-between">
                    <h2 className="section-title">{group.label}</h2>
                    <span className="text-xs text-zinc-400">{group.items.length}</span>
                  </div>

                  <div className="mt-2 list border-t border-zinc-100">
                    {group.items.map((task) => {
                      const done = task.status === 'completed';
                      const d = daysUntil(task.deadline);
                      const tone =
                        d <= 1 ? 'text-red-600' : d <= 3 ? 'text-amber-600' : 'text-zinc-400';

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
                              {task.course} · {task.task_type}
                              {task.priority === 'high' && !done && ' · high priority'}
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
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )
          )}
        </div>
      )}

      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-zinc-900/20 flex items-center justify-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add item"
            className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-overlay animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Add item</h2>
              <button onClick={() => setShowAdd(false)} className="btn-ghost btn-sm" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={create} className="p-5 space-y-4">
              <div>
                <label className="label" htmlFor="t-title">Task name</label>
                <input
                  id="t-title"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lab report, chapter 3"
                  autoFocus
                />
              </div>

              <div>
                <label className="label" htmlFor="t-course">Course</label>
                <input
                  id="t-course"
                  className="input-field"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Data Structures and Algorithms"
                  list="course-presets"
                />
                <datalist id="course-presets">
                  {courses.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="t-type">Type</label>
                  <select
                    id="t-type"
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
                  <label className="label" htmlFor="t-priority">Priority</label>
                  <select
                    id="t-priority"
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
                <label className="label" htmlFor="t-deadline">Deadline</label>
                <input
                  id="t-deadline"
                  type="datetime-local"
                  className="input-field"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="t-notes">Notes</label>
                <textarea
                  id="t-notes"
                  rows={2}
                  className="input-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="File format, grading criteria…"
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
