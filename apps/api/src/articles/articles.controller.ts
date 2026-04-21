import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/permissions/require-permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { SupabaseService } from '../common/supabase/supabase.service';
import { ImageUploadInterceptor } from '../common/upload/image-upload.interceptor';

type AuthUser = {
  id: string;
  role: string;
};

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.MEDIA_UPLOAD)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('admin/upload-cover')
  @UseInterceptors(ImageUploadInterceptor('file'))
  async uploadArticleCoverImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('slug') slug?: string,
  ) {
    const uploadedFile = await this.supabaseService.uploadArticleCoverImage(
      file,
      slug,
    );

    return {
      message: 'Article cover image uploaded successfully',
      file: uploadedFile,
    };
  }

  // 🔐 CREATE
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateArticleDto) {
    return this.articlesService.create(user, dto);
  }

  // 🔐 UPDATE
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ARTICLE_EDIT)
  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, user, dto);
  }

  // 🔐 DELETE
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ARTICLE_DELETE)
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.articlesService.delete(id, user.id);
  }

  // 🔐 ADMIN LIST
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ARTICLE_VIEW_ADMIN)
  @Get('admin')
  findAllAdmin() {
    return this.articlesService.findAllAdmin();
  }

  // 🌍 PUBLIC LIST
  @Get()
  findPublished() {
    return this.articlesService.findPublished();
  }

  // 🌍 PUBLIC DETAIL
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }
}
