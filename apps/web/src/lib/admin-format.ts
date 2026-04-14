export function formatWeight(value: string | number) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return numeric.toFixed(4);
}
