import { randomBytes } from 'crypto';

export function generateSecretUserId(): string {
  const randomPart = randomBytes(8).toString('hex').toUpperCase();
  return `ER-${randomPart}`;
}
