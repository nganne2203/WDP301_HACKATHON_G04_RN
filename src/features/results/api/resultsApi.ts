import { api } from '../../../core/api/client';
import type { PublishResultsRequest, PublishResultsResult } from '../../../core/api/types';

export const resultsApi = {
  publish: (data: PublishResultsRequest) =>
    api.post<PublishResultsResult>('/results/publish', data),
};
