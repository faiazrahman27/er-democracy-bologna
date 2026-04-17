import { Response } from 'express';
import type { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'er_refresh_token';

type SetRefreshTokenCookieInput = {
  response: Response;
  refreshToken: string;
  cookieSecure: boolean;
  cookieDomain?: string;
  maxAgeMs: number;
};

function getRefreshTokenCookieOptions(input: {
  cookieSecure: boolean;
  cookieDomain?: string;
  maxAgeMs?: number;
}): CookieOptions {
  return {
    httpOnly: true,
    secure: input.cookieSecure,
    sameSite: input.cookieSecure ? 'none' : 'lax',
    domain: input.cookieDomain || undefined,
    path: '/',
    ...(input.maxAgeMs !== undefined ? { maxAge: input.maxAgeMs } : {}),
  };
}

export function setRefreshTokenCookie(input: SetRefreshTokenCookieInput) {
  input.response.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    input.refreshToken,
    getRefreshTokenCookieOptions({
      cookieSecure: input.cookieSecure,
      cookieDomain: input.cookieDomain,
      maxAgeMs: input.maxAgeMs,
    }),
  );
}

export function clearRefreshTokenCookie(
  response: Response,
  cookieSecure: boolean,
  cookieDomain?: string,
) {
  response.clearCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    getRefreshTokenCookieOptions({
      cookieSecure,
      cookieDomain,
    }),
  );
}
