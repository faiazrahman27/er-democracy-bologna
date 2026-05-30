import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyHashService } from './privacy-hash.service';

describe('PrivacyHashService', () => {
  let service: PrivacyHashService;

  const privacySecret =
    'test-privacy-hmac-secret-at-least-32-characters-long';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyHashService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PRIVACY_HMAC_SECRET') {
                return privacySecret;
              }

              return undefined;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (key === 'PRIVACY_HMAC_SECRET') {
                return privacySecret;
              }

              throw new Error(`Missing config value: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrivacyHashService>(PrivacyHashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates deterministic assessment owner hashes for the same user', () => {
    const firstHash = service.createAssessmentOwnerHash('user-1');
    const secondHash = service.createAssessmentOwnerHash('user-1');

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates different assessment owner hashes for different users', () => {
    const firstHash = service.createAssessmentOwnerHash('user-1');
    const secondHash = service.createAssessmentOwnerHash('user-2');

    expect(firstHash).not.toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    expect(secondHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates deterministic per-vote voter hashes for the same vote and user', () => {
    const firstHash = service.createVoteVoterHash('vote-1', 'user-1');
    const secondHash = service.createVoteVoterHash('vote-1', 'user-1');

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates different voter hashes for the same user across different votes', () => {
    const firstHash = service.createVoteVoterHash('vote-1', 'user-1');
    const secondHash = service.createVoteVoterHash('vote-2', 'user-1');

    expect(firstHash).not.toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    expect(secondHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates different voter hashes for different users on the same vote', () => {
    const firstHash = service.createVoteVoterHash('vote-1', 'user-1');
    const secondHash = service.createVoteVoterHash('vote-1', 'user-2');

    expect(firstHash).not.toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    expect(secondHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('keeps assessment owner hashes separate from per-vote voter hashes', () => {
    const assessmentOwnerHash = service.createAssessmentOwnerHash('user-1');
    const voteVoterHash = service.createVoteVoterHash('vote-1', 'user-1');

    expect(assessmentOwnerHash).not.toBe(voteVoterHash);
    expect(assessmentOwnerHash).toMatch(/^[a-f0-9]{64}$/);
    expect(voteVoterHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('does not expose raw user IDs or vote IDs inside generated hashes', () => {
    const assessmentOwnerHash = service.createAssessmentOwnerHash('user-1');
    const voteVoterHash = service.createVoteVoterHash('vote-1', 'user-1');

    expect(assessmentOwnerHash).not.toContain('user-1');
    expect(voteVoterHash).not.toContain('user-1');
    expect(voteVoterHash).not.toContain('vote-1');
  });
});
