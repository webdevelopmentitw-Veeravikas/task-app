export const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export function statusLabel(value) {
  return STATUSES.find((status) => status.value === value)?.label ?? value;
}
