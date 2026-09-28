import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTaskId, validateTask } from '../src/validate.js';

test('accepts a task and defaults status to pending', () => {
  const result = validateTask({
    title: '  Write the pipeline  ',
    description: ' Jenkins stages ',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    title: 'Write the pipeline',
    description: 'Jenkins stages',
    status: 'pending',
  });
});

test('rejects a missing title', () => {
  const result = validateTask({ title: '   ', status: 'done' });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /Title is required/);
});

test('rejects an unknown status', () => {
  const result = validateTask({ title: 'Deploy', status: 'archived' });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /Status must be/);
});

test('requires status when updating', () => {
  const result = validateTask({ title: 'Deploy', description: '' }, { defaultStatus: false });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /Status is required/);
});

test('rejects a description that is too long', () => {
  const result = validateTask({
    title: 'Notes',
    description: 'a'.repeat(2001),
    status: 'pending',
  });
  assert.equal(result.ok, false);
});

test('rejects a non-object body', () => {
  const result = validateTask(['not', 'a', 'task']);
  assert.equal(result.ok, false);
});

test('parses positive integer ids', () => {
  assert.equal(parseTaskId('12'), 12);
  assert.equal(parseTaskId('0'), null);
  assert.equal(parseTaskId('01'), null);
  assert.equal(parseTaskId('abc'), null);
});
