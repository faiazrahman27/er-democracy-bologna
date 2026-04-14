import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(adminUserId: string, dto: CreateArticleDto) {
    const article = await this.prisma.article.create({
      data: {
        title: dto.title.trim(),
        slug: dto.slug.trim(),
        summary: dto.summary.trim(),
        content: dto.content,
        coverImageUrl: dto.coverImageUrl?.trim(),
        coverImageAlt: dto.coverImageAlt?.trim(),
        status: dto.status ?? 'DRAFT',
        createdById: adminUserId,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    await this.auditService.logAdminAction({
      adminUserId,
      actionType: 'ARTICLE_CREATE',
      targetType: 'Article',
      targetId: article.id,
      afterJson: { title: article.title, slug: article.slug },
    });

    return article;
  }

  async update(id: string, adminUserId: string, dto: UpdateArticleDto) {
    const existing = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Article not found');
    }

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
      adminUserId,
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
}
