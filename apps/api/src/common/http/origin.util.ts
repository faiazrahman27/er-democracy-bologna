import { ForbiddenException } from '@nestjs/common';

export function getAllowedOriginsFromConfig(
  corsOriginValue: string | undefined,
): string[] {
  const configuredOrigins =
    corsOriginValue
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  if (configuredOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must include at least one allowed origin');
  }

  return configuredOrigins;
}

export function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin.trim());
}

export function assertStateChangingOriginAllowed(input: {
  origin?: string | string[];
  referer?: string | string[];
  allowedOrigins: string[];
}) {
  const origin = Array.isArray(input.origin) ? input.origin[0] : input.origin;

  if (isAllowedOrigin(origin, input.allowedOrigins)) {
    return;
  }

  const referer = Array.isArray(input.referer)
    ? input.referer[0]
    : input.referer;

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;

      if (isAllowedOrigin(refererOrigin, input.allowedOrigins)) {
        return;
      }
    } catch {
      // Invalid referers are treated as untrusted.
    }
  }

  throw new ForbiddenException('Request origin is not allowed');
}
