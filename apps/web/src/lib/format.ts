import { ASSESSMENT_VALUE_LABELS } from "@/types/assessment";

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const ENUM_LABEL_OVERRIDES: Record<string, string> = {
  ...ASSESSMENT_VALUE_LABELS,
  SELF_ASSESSMENT: "Self-assessment",
};

function formatYearsOfExperienceLabel(years: number) {
  return `${years} ${years === 1 ? "year" : "years"}`;
}

export function formatEnumLabel(value: string | number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatYearsOfExperienceLabel(value);
  }

  const normalizedValue = String(value);
  const trimmed = normalizedValue.trim();

  if (!trimmed) {
    return normalizedValue;
  }

  if (/^\d+$/.test(trimmed)) {
    return formatYearsOfExperienceLabel(Number(trimmed));
  }

  const exactLabel = ENUM_LABEL_OVERRIDES[trimmed];
  if (exactLabel) {
    return exactLabel;
  }

  const looksLikeCode =
    trimmed === trimmed.toUpperCase() ||
    trimmed.includes("_") ||
    trimmed === trimmed.toLowerCase();
  if (!looksLikeCode) {
    return trimmed;
  }

  return trimmed
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
