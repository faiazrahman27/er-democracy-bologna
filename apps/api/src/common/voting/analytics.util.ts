type BreakdownItem = {
  label: string;
  count: number;
  percentage: number;
};

const MIN_PUBLIC_GROUP_SIZE = 3;
const MIN_PUBLIC_GROUP_PERCENTAGE = 10;

function normalizeLabel(value?: string | null): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : 'Unknown';
}

export function buildBreakdown(
  values: Array<string | null | undefined>,
): BreakdownItem[] {
  const total = values.length;

  if (total === 0) {
    return [];
  }

  const counts = new Map<string, number>();

  for (const value of values) {
    const label = normalizeLabel(value);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: Number(((count / total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function buildPublicSafeBreakdown(
  values: Array<string | null | undefined>,
): BreakdownItem[] {
  const raw = buildBreakdown(values);

  if (raw.length === 0) {
    return [];
  }

  const total = values.length;
  let otherCount = 0;
  const kept: Array<{ label: string; count: number }> = [];

  for (const item of raw) {
    const meetsCountThreshold = item.count >= MIN_PUBLIC_GROUP_SIZE;
    const meetsPercentageThreshold =
      item.percentage >= MIN_PUBLIC_GROUP_PERCENTAGE;

    if (meetsCountThreshold || meetsPercentageThreshold) {
      kept.push({
        label: item.label,
        count: item.count,
      });
    } else {
      otherCount += item.count;
    }
  }

  if (otherCount > 0) {
    kept.push({
      label: 'Other',
      count: otherCount,
    });
  }

  return kept
    .map((item) => ({
      label: item.label,
      count: item.count,
      percentage: Number(((item.count / total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
