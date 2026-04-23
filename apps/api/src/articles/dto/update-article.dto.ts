import { IsString, IsOptional, IsEnum, IsUrl, Length } from 'class-validator';
import { ArticleStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

const HTTP_URL_VALIDATION_OPTIONS = {
  protocols: ['http', 'https'],
  require_protocol: true,
  require_tld: false,
};

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(10, 1000)
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

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
