import { ForbiddenException } from '@nestjs/common';
import {
  assertStateChangingOriginAllowed,
  getAllowedOriginsFromConfig,
  isAllowedOrigin,
} from './origin.util';

describe('origin.util', () => {
  it('parses and trims configured origins', () => {
    expect(
      getAllowedOriginsFromConfig(
        ' https://app.example.com, https://admin.example.com ',
      ),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('rejects empty origin configuration', () => {
    expect(() => getAllowedOriginsFromConfig(undefined)).toThrow(
      'CORS_ORIGIN must include at least one allowed origin',
    );
  });

  it('matches allowed origins exactly after trimming', () => {
    expect(
      isAllowedOrigin(' https://app.example.com ', ['https://app.example.com']),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://evil.example.com', ['https://app.example.com']),
    ).toBe(false);
  });

  it('accepts state-changing requests when the Origin header is trusted', () => {
    expect(() =>
      assertStateChangingOriginAllowed({
        origin: 'https://app.example.com',
        allowedOrigins: ['https://app.example.com'],
      }),
    ).not.toThrow();
  });

  it('accepts state-changing requests when a trusted Referer is present', () => {
    expect(() =>
      assertStateChangingOriginAllowed({
        referer: 'https://app.example.com/login',
        allowedOrigins: ['https://app.example.com'],
      }),
    ).not.toThrow();
  });

  it('rejects missing or untrusted origin context', () => {
    expect(() =>
      assertStateChangingOriginAllowed({
        allowedOrigins: ['https://app.example.com'],
      }),
    ).toThrow(ForbiddenException);

    expect(() =>
      assertStateChangingOriginAllowed({
        origin: 'https://evil.example.com',
        referer: 'https://evil.example.com/login',
        allowedOrigins: ['https://app.example.com'],
      }),
    ).toThrow(ForbiddenException);
  });
});
