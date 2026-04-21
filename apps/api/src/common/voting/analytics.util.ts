type BreakdownItem = {
  label: string;
  count: number;
  percentage: number;
};

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

  NO_FORMAL_STUDY: 30,
  SECONDARY_EDUCATION: 31,
  VOCATIONAL_CERTIFICATION: 32,
  BACHELOR_DEGREE: 33,
  MASTER_DEGREE: 34,
  DOCTORATE: 35,
  POST_DOCTORATE: 36,

  RESIDENT: 40,
  NON_RESIDENT: 41,
  VISITOR: 42,

  PREFER_NOT_TO_SAY: 90,
  OTHER: 91,
  Other: 91,
  UNKNOWN: 92,
  Unknown: 92,
};

function normalizeLabel(value?: string | number | null): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return 'Unknown';
  }

  if (trimmed.toLowerCase() === 'other') {
    return 'Other';
  }

  if (trimmed.toLowerCase() === 'unknown') {
    return 'Unknown';
  }

  return trimmed;
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

  const aNumeric = /^\d+$/.test(a.label) ? Number(a.label) : Number.NaN;
  const bNumeric = /^\d+$/.test(b.label) ? Number(b.label) : Number.NaN;

  if (Number.isFinite(aNumeric) && Number.isFinite(bNumeric)) {
    return aNumeric - bNumeric;
  }

  if (Number.isFinite(aNumeric)) {
    return -1;
  }

  if (Number.isFinite(bNumeric)) {
    return 1;
  }

  return b.count - a.count || a.label.localeCompare(b.label);
}

function buildFromNormalizedLabels(labels: string[]): BreakdownItem[] {
  const total = labels.length;

  if (total === 0) {
    return [];
  }

  const counts = new Map<string, number>();

  for (const label of labels) {
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

export function buildBreakdown(
  values: Array<string | number | null | undefined>,
): BreakdownItem[] {
  const labels = values.map((value) => normalizeLabel(value));
  return buildFromNormalizedLabels(labels);
}
