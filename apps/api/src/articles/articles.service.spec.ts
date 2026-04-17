import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let prisma: {
    article: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let auditService: {
    logAdminAction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      article: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    auditService = {
      logAdminAction: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('allows draft creation without publish permission', async () => {
    prisma.article.create.mockResolvedValue({
      id: 'article-1',
      title: 'New article',
      slug: 'new-article',
      status: 'DRAFT',
    });

    await service.create(
      { id: 'admin-1', role: 'EDITOR_WITHOUT_PUBLISH' },
      {
        title: '  New article  ',
        slug: '  new-article  ',
        summary: 'A sufficiently long article summary',
        content: 'Article body',
      },
    );

    expect(prisma.article.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'New article',
        slug: 'new-article',
        status: 'DRAFT',
        createdById: 'admin-1',
        publishedAt: null,
      }),
    });
  });

  it('blocks publishing on create without ARTICLE_PUBLISH', async () => {
    await expect(
      service.create(
        { id: 'admin-1', role: 'EDITOR_WITHOUT_PUBLISH' },
        {
          title: 'New article',
          slug: 'new-article',
          summary: 'A sufficiently long article summary',
          content: 'Article body',
          status: 'PUBLISHED',
        },
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.article.create).not.toHaveBeenCalled();
    expect(auditService.logAdminAction).not.toHaveBeenCalled();
  });

  it('allows content edits when the article status is unchanged', async () => {
    prisma.article.findUnique.mockResolvedValue({
      id: 'article-1',
      title: 'Existing title',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prisma.article.update.mockResolvedValue({
      id: 'article-1',
      title: 'Updated title',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await service.update(
      'article-1',
      { id: 'admin-1', role: 'EDITOR_WITHOUT_PUBLISH' },
      {
        title: '  Updated title  ',
        status: 'PUBLISHED',
      },
    );

    expect(prisma.article.update).toHaveBeenCalledWith({
      where: { id: 'article-1' },
      data: expect.objectContaining({
        title: 'Updated title',
        status: 'PUBLISHED',
      }),
    });
  });

  it('blocks article status changes on update without ARTICLE_PUBLISH', async () => {
    prisma.article.findUnique.mockResolvedValue({
      id: 'article-1',
      title: 'Existing title',
      status: 'DRAFT',
      publishedAt: null,
    });

    await expect(
      service.update(
        'article-1',
        { id: 'admin-1', role: 'EDITOR_WITHOUT_PUBLISH' },
        {
          status: 'PUBLISHED',
        },
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.article.update).not.toHaveBeenCalled();
    expect(auditService.logAdminAction).not.toHaveBeenCalled();
  });

  it('allows article status changes on update with ARTICLE_PUBLISH', async () => {
    prisma.article.findUnique.mockResolvedValue({
      id: 'article-1',
      title: 'Existing title',
      status: 'DRAFT',
      publishedAt: null,
    });
    const publishedAt = new Date('2026-02-01T00:00:00.000Z');
    prisma.article.update.mockResolvedValue({
      id: 'article-1',
      title: 'Existing title',
      status: 'PUBLISHED',
      publishedAt,
    });

    await service.update(
      'article-1',
      { id: 'admin-1', role: 'CONTENT_ADMIN' },
      {
        status: 'PUBLISHED',
      },
    );

    expect(prisma.article.update).toHaveBeenCalledWith({
      where: { id: 'article-1' },
      data: expect.objectContaining({
        status: 'PUBLISHED',
        publishedAt: expect.any(Date),
      }),
    });
    expect(auditService.logAdminAction).toHaveBeenCalled();
  });
});
