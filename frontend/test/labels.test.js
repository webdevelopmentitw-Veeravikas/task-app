import test from 'node:test';
import assert from 'node:assert/strict';
import { STATUSES, statusLabel } from '../src/labels.js';

test('known statuses have labels', () => {
  assert.equal(statusLabel('pending'), 'Pending');
  assert.equal(statusLabel('in_progress'), 'In progress');
  assert.equal(statusLabel('done'), 'Done');
});

test('an unknown status is returned unchanged', () => {
  assert.equal(statusLabel('custom'), 'custom');
});

test('the workflow has three statuses', () => {
  assert.deepEqual(
    STATUSES.map((status) => status.value),
    ['pending', 'in_progress', 'done']
  );
});
