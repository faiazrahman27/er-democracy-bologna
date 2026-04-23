import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { ArticleStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTP_URL_VALIDATION_OPTIONS = {
  protocols: ['http', 'https'],
  require_protocol: true,
  require_tld: false,
};

export class CreateArticleDto {
  @IsString()
  @Length(3, 200)
  title!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Length(3, 180)
  @Matches(SLUG_PATTERN, {
    message:
      'slug must contain only lowercase letters, numbers, and single hyphens',
  })
  slug!: string;

  @IsString()
  @Length(10, 1000)
  summary!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsUrl(HTTP_URL_VALIDATION_OPTIONS, {
    message: 'coverImageUrl must be a valid http or https URL',
  })
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  coverImageAlt?: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
