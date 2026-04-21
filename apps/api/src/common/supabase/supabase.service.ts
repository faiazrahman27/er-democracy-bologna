import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class SupabaseService {
  private readonly client: ReturnType<typeof createClient>;
  private readonly bucketName: string;
  private readonly maxFileSizeBytes: number;
  private readonly allowedMimeTypes: Set<string>;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    const bucketName = this.configService.get<string>(
      'SUPABASE_STORAGE_BUCKET',
    );

    if (!supabaseUrl || !supabaseServiceRoleKey || !bucketName) {
      throw new InternalServerErrorException(
        'Supabase storage environment variables are not configured correctly',
      );
    }

    this.client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.bucketName = bucketName;

    this.maxFileSizeBytes = Number(
      this.configService.get<number>('UPLOAD_MAX_FILE_SIZE_BYTES') ??
        2 * 1024 * 1024,
    );

    const allowedMimeTypesRaw =
      this.configService.get<string>('UPLOAD_ALLOWED_IMAGE_MIME_TYPES') ??
      'image/jpeg,image/png,image/webp';

    this.allowedMimeTypes = new Set(
      allowedMimeTypesRaw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
  }

  validateImageFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype || !this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type. Allowed types: ${Array.from(this.allowedMimeTypes).join(', ')}`,
      );
    }

    if (!file.buffer || file.size <= 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `Image file is too large. Maximum allowed size is ${this.maxFileSizeBytes} bytes`,
      );
    }
  }

  async uploadVoteCoverImage(file: Express.Multer.File, slug?: string) {
    this.validateImageFile(file);

    const extension = this.getSafeExtension(file.originalname, file.mimetype);
    const safeSlug = this.slugifySegment(slug ?? 'vote', 'vote');
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
    const objectPath = `votes/${safeSlug}/${fileName}`;

    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to upload image: ${error.message}`,
      );
    }

    const { data } = this.client.storage
      .from(this.bucketName)
      .getPublicUrl(objectPath);

    return {
      bucket: this.bucketName,
      path: objectPath,
      publicUrl: data.publicUrl,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  async uploadArticleCoverImage(file: Express.Multer.File, slug?: string) {
    this.validateImageFile(file);

    const extension = this.getSafeExtension(file.originalname, file.mimetype);
    const safeSlug = this.slugifySegment(slug ?? 'article', 'article');
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
    const objectPath = `articles/${safeSlug}/${fileName}`;

    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to upload image: ${error.message}`,
      );
    }

    const { data } = this.client.storage
      .from(this.bucketName)
      .getPublicUrl(objectPath);

    return {
      bucket: this.bucketName,
      path: objectPath,
      publicUrl: data.publicUrl,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  private getSafeExtension(originalName: string, mimeType: string) {
    const fileNameParts = originalName.split('.');
    const rawExtension =
      fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : '';

    const normalizedExtension = rawExtension.trim().toLowerCase();

    if (
      normalizedExtension === 'jpg' ||
      normalizedExtension === 'jpeg' ||
      normalizedExtension === 'png' ||
      normalizedExtension === 'webp'
    ) {
      return normalizedExtension === 'jpeg' ? 'jpg' : normalizedExtension;
    }

    if (mimeType === 'image/jpeg') {
      return 'jpg';
    }

    if (mimeType === 'image/png') {
      return 'png';
    }

    if (mimeType === 'image/webp') {
      return 'webp';
    }

    throw new BadRequestException('Could not determine a safe file extension');
  }

  private slugifySegment(value: string, fallback: string) {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || fallback
    );
  }
}
