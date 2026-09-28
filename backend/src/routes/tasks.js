import { Router } from 'express';
import { parseTaskId, validateTask } from '../validate.js';

const TASK_COLUMNS = 'id, title, description, status, created_at, updated_at';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

async function findTask(pool, id) {
  const [rows] = await pool.execute(
    `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

export function createTaskRouter(pool) {
  const router = Router();

  router.get('/', asyncHandler(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT ${TASK_COLUMNS} FROM tasks ORDER BY created_at DESC, id DESC`
    );
    res.json(rows);
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const id = parseTaskId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid task id.' });
    }

    const task = await findTask(pool, id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json(task);
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const result = validateTask(req.body);
    if (!result.ok) {
      return res.status(400).json({ error: result.errors.join(' ') });
    }

    const { title, description, status } = result.value;
    const [inserted] = await pool.execute(
      'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
      [title, description, status]
    );
    const task = await findTask(pool, inserted.insertId);
    return res.status(201).json(task);
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    const id = parseTaskId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid task id.' });
    }

    const result = validateTask(req.body, { defaultStatus: false });
    if (!result.ok) {
      return res.status(400).json({ error: result.errors.join(' ') });
    }

    const { title, description, status } = result.value;
    const [updated] = await pool.execute(
      'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
      [title, description, status, id]
    );

    if (updated.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = await findTask(pool, id);
    return res.json(task);
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const id = parseTaskId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid task id.' });
    }

    const [deleted] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
    if (deleted.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.status(204).send();
  }));

  return router;
}
