import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { ArticleStatus } from '@prisma/client';

export class CreateArticleDto {
  @IsString()
  @Length(3, 200)
  title!: string;

  @IsString()
  @Length(3, 180)
  slug!: string;

  @IsString()
  @Length(10, 1000)
  summary!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  coverImageAlt?: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
