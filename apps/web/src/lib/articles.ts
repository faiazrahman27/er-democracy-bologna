import { apiRequest } from '@/lib/api';

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ArticleItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateArticlePayload = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  status?: ArticleStatus;
};

export type UpdateArticlePayload = {
  title?: string;
  summary?: string;
  content?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  status?: ArticleStatus;
};

export async function fetchAdminArticles(token: string) {
  return apiRequest<ArticleItem[]>('/articles/admin', {
    method: 'GET',
    token,
  });
}

export async function createArticle(
  token: string,
  payload: CreateArticlePayload,
) {
  return apiRequest<ArticleItem>('/articles', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function updateArticle(
  token: string,
  articleId: string,
  payload: UpdateArticlePayload,
) {
  return apiRequest<ArticleItem>(`/articles/${articleId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function deleteArticle(token: string, articleId: string) {
  return apiRequest<{ message: string }>(`/articles/${articleId}`, {
    method: 'DELETE',
    token,
  });
}

export async function fetchPublicArticles() {
  return apiRequest<ArticleItem[]>('/articles', {
    method: 'GET',
  });
}

export async function fetchPublicArticleBySlug(slug: string) {
  return apiRequest<ArticleItem>(`/articles/${slug}`, {
    method: 'GET',
  });
}
