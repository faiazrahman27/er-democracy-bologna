import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'SUPABASE_URL':
                  return 'https://example.supabase.co';
                case 'SUPABASE_SERVICE_ROLE_KEY':
                  return 'service-role-key';
                case 'SUPABASE_STORAGE_BUCKET':
                  return 'uploads';
                case 'UPLOAD_MAX_FILE_SIZE_BYTES':
                  return 2 * 1024 * 1024;
                case 'UPLOAD_ALLOWED_IMAGE_MIME_TYPES':
                  return 'image/jpeg,image/png,image/webp';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  it('accepts files whose content matches the declared jpeg type', () => {
    expect(() =>
      service.validateImageFile({
        originalname: 'cover.jpg',
        mimetype: 'image/jpeg',
        size: 128,
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
      } as Express.Multer.File),
    ).not.toThrow();
  });

  it('rejects spoofed file contents even when the mime type looks allowed', () => {
    expect(() =>
      service.validateImageFile({
        originalname: 'cover.png',
        mimetype: 'image/png',
        size: 128,
        buffer: Buffer.from('not-a-real-png', 'utf8'),
      } as Express.Multer.File),
    ).toThrow(BadRequestException);
  });

  it('rejects empty uploads', () => {
    expect(() =>
      service.validateImageFile({
        originalname: 'cover.webp',
        mimetype: 'image/webp',
        size: 0,
        buffer: Buffer.alloc(0),
      } as Express.Multer.File),
    ).toThrow(BadRequestException);
  });
});
