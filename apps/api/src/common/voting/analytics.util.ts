type BreakdownItem = {
  label: string;
  count: number;
  percentage: number;
};

const MIN_PUBLIC_GROUP_SIZE = 3;
const MIN_PUBLIC_GROUP_PERCENTAGE = 10;
const BREAKDOWN_LABEL_ORDER: Record<string, number> = {
  AGE_18_24: 1,
  AGE_25_34: 2,
  AGE_35_44: 3,
  AGE_45_54: 4,
  AGE_55_64: 5,
  AGE_65_PLUS: 6,
  MALE: 10,
  FEMALE: 11,
  NON_BINARY: 12,
  BEGINNER: 20,
  INTERMEDIATE: 21,
  ADVANCED: 22,
  EXPERT: 23,
  RESIDENT: 30,
  NON_RESIDENT: 31,
  VISITOR: 32,
  PREFER_NOT_TO_SAY: 90,
  OTHER: 91,
  Other: 91,
  Unknown: 92,
};

function normalizeLabel(value?: string | null): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : 'Unknown';
}

function sortBreakdownItems(a: BreakdownItem, b: BreakdownItem): number {
  const aOrder = BREAKDOWN_LABEL_ORDER[a.label];
  const bOrder = BREAKDOWN_LABEL_ORDER[b.label];

  if (aOrder !== undefined && bOrder !== undefined) {
    return aOrder - bOrder;
  }

  if (aOrder !== undefined) {
    return -1;
  }

  if (bOrder !== undefined) {
    return 1;
  }

  return b.count - a.count || a.label.localeCompare(b.label);
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
    .sort(sortBreakdownItems);
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
    .sort(sortBreakdownItems);
}
