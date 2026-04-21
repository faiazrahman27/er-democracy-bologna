import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Type,
  mixin,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

const DEFAULT_UPLOAD_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const DEFAULT_UPLOAD_MAX_FILE_COUNT = 1;

export function ImageUploadInterceptor(
  fieldName = 'file',
): Type<NestInterceptor> {
  @Injectable()
  class ConfiguredImageUploadInterceptor implements NestInterceptor {
    private readonly delegate: NestInterceptor;

    constructor(private readonly configService: ConfigService) {
      const maxFileSizeBytes = Number(
        this.configService.get<number>('UPLOAD_MAX_FILE_SIZE_BYTES') ??
          DEFAULT_UPLOAD_MAX_FILE_SIZE_BYTES,
      );

      const MulterInterceptor = FileInterceptor(fieldName, {
        storage: memoryStorage(),
        limits: {
          fileSize: maxFileSizeBytes,
          files: DEFAULT_UPLOAD_MAX_FILE_COUNT,
        },
      });

      this.delegate = new MulterInterceptor();
    }

    intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): ReturnType<NestInterceptor['intercept']> {
      return this.delegate.intercept(context, next);
    }
  }

  return mixin(ConfiguredImageUploadInterceptor);
}
