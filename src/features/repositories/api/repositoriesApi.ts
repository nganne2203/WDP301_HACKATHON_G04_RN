import { api, getPaginated } from '../../../core/api/client';
import type {
  ListRepositoriesQuery,
  Repository,
  RepositoryAiReview,
  RepositoryCommit,
  RepositoryCommitDiff,
  RepositoryImpactDecision,
  RepositoryStaticAnalysisResult,
} from '../../../core/api/types';

export const repositoriesApi = {
  list: (query?: ListRepositoriesQuery) =>
    getPaginated<Repository[]>('/repositories', query as Record<string, string | number | undefined> | undefined),

  getById: (id: string) => api.get<Repository>(`/repositories/${id}`),

  listCommits: (id: string, page = 1, limit = 20) =>
    getPaginated<RepositoryCommit[]>(`/repositories/${id}/commits`, { page, limit }),

  listCommitDiffs: (id: string, page = 1, limit = 20) =>
    getPaginated<RepositoryCommitDiff[]>(`/repositories/${id}/commit-diffs`, { page, limit }),

  listStaticAnalysis: (id: string, page = 1, limit = 20) =>
    getPaginated<RepositoryStaticAnalysisResult[]>(`/repositories/${id}/static-analysis`, { page, limit }),

  listImpactDecisions: (id: string, page = 1, limit = 20) =>
    getPaginated<RepositoryImpactDecision[]>(`/repositories/${id}/impact-decisions`, { page, limit }),

  listAiReviews: (id: string, page = 1, limit = 20) =>
    api.get<{ repository: Repository | null; aiReviews: RepositoryAiReview[] }>(`/repositories/${id}/ai-reviews`, {
      params: { page, limit },
    }),
};
