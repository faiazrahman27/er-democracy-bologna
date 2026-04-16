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

export type AdminUploadArticleCoverResponse = {
  message: string;
  file: {
    bucket: string;
    path: string;
    publicUrl: string;
    mimeType: string;
    size: number;
    originalName: string;
  };
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

export async function uploadAdminArticleCover(
  token: string,
  file: File,
  slug?: string,
) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  if (slug && slug.trim()) {
    formData.append('slug', slug.trim());
  }

  const response = await fetch(`${apiBaseUrl}/articles/admin/upload-cover`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let message = 'Failed to upload article cover image';

    try {
      const errorData = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(errorData?.message)) {
        message = errorData.message.join(', ');
      } else if (typeof errorData?.message === 'string') {
        message = errorData.message;
      }
    } catch {
      // ignore JSON parsing failure and keep default message
    }

    throw new Error(message);
  }

  return (await response.json()) as AdminUploadArticleCoverResponse;
}
