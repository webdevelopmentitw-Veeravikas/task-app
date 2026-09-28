import { useCallback, useEffect, useMemo, useState } from 'react';
import { createTask, deleteTask, fetchTasks, updateTask } from './api.js';
import { STATUSES, statusLabel } from './labels.js';

const EMPTY_FORM = { title: '', description: '', status: 'pending' };
const FILTERS = [{ value: 'all', label: 'All' }, ...STATUSES];

function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatusFields({ form, onChange, disabled }) {
  return (
    <>
      <div className="field">
        <label htmlFor={form.fieldId ? `${form.fieldId}-title` : 'title'}>Title</label>
        <input
          id={form.fieldId ? `${form.fieldId}-title` : 'title'}
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          maxLength={255}
          required
          disabled={disabled}
        />
      </div>
      <div className="field">
        <label htmlFor={form.fieldId ? `${form.fieldId}-status` : 'status'}>Status</label>
        <select
          id={form.fieldId ? `${form.fieldId}-status` : 'status'}
          value={form.status}
          onChange={(event) => onChange({ ...form, status: event.target.value })}
          disabled={disabled}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field field-wide">
        <label htmlFor={form.fieldId ? `${form.fieldId}-description` : 'description'}>
          Description
        </label>
        <textarea
          id={form.fieldId ? `${form.fieldId}-description` : 'description'}
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          maxLength={2000}
          disabled={disabled}
        />
      </div>
    </>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_FORM);
  const [confirmingId, setConfirmingId] = useState(null);

  const loadTasks = useCallback(async () => {
    const data = await fetchTasks();
    setTasks(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let active = true;

    loadTasks()
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadTasks]);

  const counts = useMemo(() => {
    const next = { all: tasks.length, pending: 0, in_progress: 0, done: 0 };
    for (const task of tasks) {
      if (next[task.status] != null) next[task.status] += 1;
    }
    return next;
  }, [tasks]);

  const visibleTasks = tasks.filter((task) => filter === 'all' || task.status === filter);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await createTask({
        title: form.title,
        description: form.description,
        status: form.status,
      });
      setForm(EMPTY_FORM);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(task) {
    setEditingId(task.id);
    setConfirmingId(null);
    setDraft({
      title: task.title,
      description: task.description || '',
      status: task.status,
      fieldId: `edit-${task.id}`,
    });
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await updateTask(editingId, {
        title: draft.title,
        description: draft.description,
        status: draft.status,
      });
      setEditingId(null);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);
    setError('');

    try {
      await deleteTask(id);
      if (editingId === id) setEditingId(null);
      setConfirmingId(null);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <p className="eyebrow">DevOps practice</p>
          <h1>Task Manager</h1>
          <p className="lede">Add, update, and close work items stored in MySQL.</p>
        </div>
      </header>

      <main className="wrap">
        {error ? (
          <p className="banner" role="alert">
            {error}
          </p>
        ) : null}

        <section className="panel">
          <div className="panel-head">
            <h2>New task</h2>
          </div>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <StatusFields form={form} onChange={setForm} disabled={saving} />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add task'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel" aria-live="polite">
          <div className="panel-head">
            <h2>Tasks</h2>
            <p>{counts.all === 1 ? '1 task' : `${counts.all} tasks`}</p>
          </div>

          <div className="filters" role="tablist" aria-label="Filter tasks">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={filter === item.value ? 'filter filter-active' : 'filter'}
                onClick={() => setFilter(item.value)}
              >
                {item.label} ({counts[item.value] || 0})
              </button>
            ))}
          </div>

          {loading ? <p className="empty">Loading tasks…</p> : null}

          {!loading && visibleTasks.length === 0 ? (
            <p className="empty">
              {tasks.length === 0 ? 'No tasks yet. Add one above.' : 'No tasks in this view.'}
            </p>
          ) : null}

          <ul className="tasks">
            {visibleTasks.map((task) => (
              <li key={task.id} className="task">
                {editingId === task.id ? (
                  <form onSubmit={handleUpdate}>
                    <div className="form-grid">
                      <StatusFields form={draft} onChange={setDraft} disabled={saving} />
                    </div>
                    <div className="actions">
                      <button className="btn btn-primary" type="submit" disabled={saving}>
                        Save
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        disabled={saving}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="task-top">
                      <h3>{task.title}</h3>
                      <span className="badge" data-status={task.status}>
                        {statusLabel(task.status)}
                      </span>
                    </div>
                    {task.description ? <p>{task.description}</p> : null}
                    <p className="meta">Updated {formatWhen(task.updated_at || task.created_at)}</p>
                    <div className="actions">
                      <button
                        className="btn btn-ghost"
                        type="button"
                        disabled={saving}
                        onClick={() => startEdit(task)}
                      >
                        Edit
                      </button>
                      {confirmingId === task.id ? (
                        <>
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={saving}
                            onClick={() => handleDelete(task.id)}
                          >
                            Confirm delete
                          </button>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={saving}
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-danger"
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setConfirmingId(task.id);
                            setEditingId(null);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
