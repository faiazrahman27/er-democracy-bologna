import { ArticleStatus } from '@prisma/client';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { roleHasPermission } from '../auth/permissions/role-permissions.constants';

type ArticleActor = {
  id: string;
  role: string;
};

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(actor: ArticleActor, dto: CreateArticleDto) {
    this.assertCanChangePublicationStatus(actor.role, null, dto.status);

    const article = await this.prisma.article.create({
      data: {
        title: dto.title.trim(),
        slug: dto.slug.trim(),
        summary: dto.summary.trim(),
        content: dto.content,
        coverImageUrl: dto.coverImageUrl?.trim(),
        coverImageAlt: dto.coverImageAlt?.trim(),
        status: dto.status ?? 'DRAFT',
        createdById: actor.id,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    await this.auditService.logAdminAction({
      adminUserId: actor.id,
      actionType: 'ARTICLE_CREATE',
      targetType: 'Article',
      targetId: article.id,
      afterJson: { title: article.title, slug: article.slug },
    });

    return article;
  }

  async update(id: string, actor: ArticleActor, dto: UpdateArticleDto) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    this.assertCanChangePublicationStatus(
      actor.role,
      existing.status,
      dto.status,
    );

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        summary: dto.summary?.trim(),
        content: dto.content,
        coverImageUrl: dto.coverImageUrl?.trim(),
        coverImageAlt: dto.coverImageAlt?.trim(),
        status: dto.status,
        publishedAt:
          dto.status === 'PUBLISHED' && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
      },
    });

    await this.auditService.logAdminAction({
      adminUserId: actor.id,
      actionType: 'ARTICLE_UPDATE',
      targetType: 'Article',
      targetId: id,
      beforeJson: { title: existing.title },
      afterJson: { title: updated.title },
    });

    return updated;
  }

  async delete(id: string, adminUserId: string) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    await this.prisma.article.delete({
      where: { id },
    });

    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'ARTICLE_DELETE',
      targetType: 'Article',
      targetId: id,
    });

    return { message: 'Article deleted successfully' };
  }

  async findAllAdmin() {
    return this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublished() {
    return this.prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article || article.status !== 'PUBLISHED') {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  private assertCanChangePublicationStatus(
    role: string,
    currentStatus: ArticleStatus | null,
    requestedStatus?: ArticleStatus,
  ) {
    const nextStatus =
      currentStatus === null ? (requestedStatus ?? 'DRAFT') : requestedStatus;

    if (!nextStatus) {
      return;
    }

    const isStatusChange =
      currentStatus === null
        ? nextStatus !== 'DRAFT'
        : nextStatus !== currentStatus;

    if (!isStatusChange) {
      return;
    }

    if (!roleHasPermission(role, PERMISSIONS.ARTICLE_PUBLISH)) {
      throw new ForbiddenException(
        'You do not have permission to change article publication status',
      );
    }
  }
}
