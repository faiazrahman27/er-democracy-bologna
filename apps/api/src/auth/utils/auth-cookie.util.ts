import { Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'er_refresh_token';

type SetRefreshTokenCookieInput = {
  response: Response;
  refreshToken: string;
  cookieSecure: boolean;
  cookieDomain?: string;
  maxAgeMs: number;
};

export function setRefreshTokenCookie(input: SetRefreshTokenCookieInput) {
  input.response.cookie(REFRESH_TOKEN_COOKIE_NAME, input.refreshToken, {
    httpOnly: true,
    secure: input.cookieSecure,
    sameSite: 'lax',
    domain: input.cookieDomain || undefined,
    path: '/',
    maxAge: input.maxAgeMs,
  });
}

export function clearRefreshTokenCookie(
  response: Response,
  cookieSecure: boolean,
  cookieDomain?: string,
) {
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    domain: cookieDomain || undefined,
    path: '/',
  });
}
