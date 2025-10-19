const cleanup = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();

export function slugify(value: string): string {
  const base = cleanup(value);
  return base || 'form';
}

export function fieldKey(value: string): string {
  const base = cleanup(value).replace(/-/g, '_');
  if (!base) {
    return 'field';
  }

  if (!/^[a-zA-Z]/.test(base)) {
    return `field_${base}`;
  }

  return base;
}
