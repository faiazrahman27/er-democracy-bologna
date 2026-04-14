import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/permissions/require-permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

type AuthUser = {
  id: string;
  role: string;
};

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // 🔐 CREATE
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ARTICLE_CREATE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateArticleDto) {
    return this.articlesService.create(user.id, dto);
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
    return this.articlesService.update(id, user.id, dto);
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
