const STATUSES = new Set(['pending', 'in_progress', 'done']);
const TITLE_MAX = 255;
const DESCRIPTION_MAX = 2000;

export function parseTaskId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) {
    return null;
  }

  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

export function validateTask(input, { defaultStatus = true } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['Request body must be an object.'] };
  }

  const errors = [];
  const value = {};

  if (typeof input.title !== 'string') {
    errors.push('Title is required.');
  } else {
    const title = input.title.trim();
    if (!title) {
      errors.push('Title is required.');
    } else if (title.length > TITLE_MAX) {
      errors.push(`Title must be ${TITLE_MAX} characters or fewer.`);
    } else {
      value.title = title;
    }
  }

  if (input.description == null || input.description === '') {
    value.description = '';
  } else if (typeof input.description !== 'string') {
    errors.push('Description must be text.');
  } else {
    const description = input.description.trim();
    if (description.length > DESCRIPTION_MAX) {
      errors.push(`Description must be ${DESCRIPTION_MAX} characters or fewer.`);
    } else {
      value.description = description;
    }
  }

  if (input.status == null || input.status === '') {
    if (defaultStatus) {
      value.status = 'pending';
    } else {
      errors.push('Status is required.');
    }
  } else if (typeof input.status !== 'string' || !STATUSES.has(input.status)) {
    errors.push('Status must be pending, in_progress, or done.');
  } else {
    value.status = input.status;
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value };
}
